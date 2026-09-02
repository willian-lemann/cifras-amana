import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { headers } from "next/headers";
import { requireActivePlan } from "@/lib/subscription";

const isProduction = process.env.NODE_ENV === "production";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileInfo {
  name: string;
  type: string;
  size: number;
}

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

  const body = await req.json();
  const files: FileInfo[] = body.files;

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: "Nenhum arquivo enviado" },
      { status: 400 },
    );
  }

  if (files.length > 40) {
    return NextResponse.json(
      { error: "Máximo de 40 arquivos por requisição" },
      { status: 400 },
    );
  }

  const folder = isProduction ? "listings" : "listings-dev";

  const results = await Promise.all(
    files.map(async (file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return { error: `Tipo não suportado: ${file.type}` };
      }

      if (file.size > MAX_IMAGE_SIZE) {
        return { error: `Arquivo muito grande: ${file.name}` };
      }

      const ext = file.name.split(".").pop() || "jpg";
      const baseName = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);

      const key = `${folder}/${session.user.id}/${baseName}.${ext}`;
      const publicUrl = `${R2_PUBLIC_URL}/${key}`;

      // Return existing URL if already uploaded (skip presigning)
      try {
        await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
        return { uploadUrl: null, publicUrl, existing: true };
      } catch {
        // Object does not exist — generate presigned URL
      }

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: file.type,
        ContentLength: file.size,
      });

      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

      return { uploadUrl, publicUrl, existing: false };
    }),
  );

  const errors = results.filter((r) => "error" in r);
  if (errors.length > 0 && errors.length === results.length) {
    return NextResponse.json(
      { error: (errors[0] as { error: string }).error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    files: results.map((r) => {
      if ("error" in r) {
        return {
          uploadUrl: null,
          publicUrl: null,
          existing: false,
          error: r.error,
        };
      }
      return r;
    }),
  });
}
