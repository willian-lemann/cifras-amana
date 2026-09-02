import { NextRequest, NextResponse } from "next/server";
import {
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { headers } from "next/headers";
import { requireActivePlan } from "@/lib/subscription";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

const isProduction = process.env.NODE_ENV === "production";

const IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const ALLOWED_MIME_SET = new Set(ALLOWED_TYPES);

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    await requireActivePlan("starter");
  } catch {
    return NextResponse.json(
      { error: "Plano ativo necessário para fazer upload de imagens" },
      { status: 403 },
    );
  }

  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado" },
      { status: 400 },
    );
  }

  if (files.length > 30) {
    return NextResponse.json(
      { error: "Máximo de 30 arquivos por requisição" },
      { status: 400 },
    );
  }

  const results = await Promise.all(
    files.map(async (file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return { error: `Tipo não suportado: ${file.type}`, publicUrl: null };
      }
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        return { error: `Arquivo muito grande: ${file.name}`, publicUrl: null };
      }

      const ext = file.name.split(".").pop() || "jpg";
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);

      const folder = isProduction ? "listings" : "listings-dev";

      const key = `${folder}/${session.user.id}/${baseName}.${ext}`;

      // Return existing URL if already uploaded
      try {
        await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        return { publicUrl: `${R2_PUBLIC_URL}/${key}`, error: null };
      } catch {
        // Object does not exist — proceed with upload
      }

      let buffer = Buffer.from(await file.arrayBuffer());

      // Validate actual file content via magic bytes (prevents Content-Type spoofing)
      const detectedType = await fileTypeFromBuffer(buffer);
      if (!detectedType || !ALLOWED_MIME_SET.has(detectedType.mime)) {
        return {
          error: `Tipo real do arquivo não corresponde ao declarado: ${file.name}`,
          publicUrl: null,
        };
      }

      // Reprocess images with Sharp to strip EXIF/metadata and cap dimensions
      if (IMAGE_MIMES.has(detectedType.mime)) {
        const sharpOpts =
          detectedType.mime === "image/gif" ? { animated: true } : {};
        const format =
          detectedType.mime === "image/png"
            ? ("png" as const)
            : detectedType.mime === "image/webp"
              ? ("webp" as const)
              : ("jpeg" as const);

        const processed = await sharp(buffer, sharpOpts)
          .rotate() // auto-rotate based on EXIF orientation
          .resize({
            width: 4096,
            height: 4096,
            fit: "inside",
            withoutEnlargement: true,
          })
          .withMetadata({}) // strip ALL metadata (EXIF, XMP, IPTC)
          .toFormat(format, { quality: 85 })
          .toBuffer();
        buffer = processed as Buffer<ArrayBuffer>;
      }

      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ContentLength: buffer.length,
        }),
      );

      return { publicUrl: `${R2_PUBLIC_URL}/${key}`, error: null };
    }),
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0 && errors.length === results.length) {
    return NextResponse.json({ error: errors[0].error }, { status: 400 });
  }

  return NextResponse.json({
    urls: results.filter((r) => r.publicUrl).map((r) => r.publicUrl),
    errors: errors.map((r) => r.error),
  });
}

// DELETE — remove one or more files from R2 by their public URLs
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { urls } = (await req.json()) as { urls: string[] };

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: "urls é obrigatório" }, { status: 400 });
  }

  // Derive the R2 key from each public URL and ensure it belongs to this user
  const userPrefix = `listings/${session.user.id}/`;
  const userPrefixDev = `listings-dev/${session.user.id}/`;

  const keys = urls
    .map((url) => {
      if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) return null;
      return url.slice(R2_PUBLIC_URL.length + 1); // strip leading slash
    })
    .filter((key): key is string => {
      if (!key) return false;
      // Only allow deleting files that belong to the authenticated user
      return key.startsWith(userPrefix) || key.startsWith(userPrefixDev);
    });

  if (keys.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  if (keys.length === 1) {
    await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: keys[0] }));
  } else {
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }

  return NextResponse.json({ deleted: keys.length });
}
