import { v2 as cloudinary } from "cloudinary";

function configuredClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

export async function uploadProjectImage(buffer: Buffer) {
  const client = configuredClient();
  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = client.uploader.upload_stream(
        { folder: "portfolio/projects", resource_type: "image" },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error ?? new Error("Upload failed"));
            return;
          }
          resolve(uploaded);
        },
      );
      stream.end(buffer);
    },
  );

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteProjectImage(publicId: string) {
  const client = configuredClient();
  const result = await client.uploader.destroy(publicId, {
    resource_type: "image",
  });
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Could not delete the cover image");
  }
}
