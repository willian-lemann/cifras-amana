import { S3Client } from "@aws-sdk/client-s3";

// Built on first use, not on import. `next build` imports every route module to
// collect page data, so validating these at module scope made the build itself
// demand the R2 credentials — which a container build does not have.
let r2Instance: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Instance) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId) throw new Error("R2_ACCOUNT_ID is required");
    if (!accessKeyId) throw new Error("R2_ACCESS_KEY_ID is required");
    if (!secretAccessKey) throw new Error("R2_SECRET_ACCESS_KEY is required");

    r2Instance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return r2Instance;
}

export const r2 = new Proxy({} as S3Client, {
  get: (_target, property) => Reflect.get(getR2Client(), property),
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "uploads";

export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
