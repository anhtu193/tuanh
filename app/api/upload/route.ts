import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { uploadProjectImage } from "@/lib/cloudinary";
import { jsonError } from "@/lib/http";
import { detectImageMime, imageLimit } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getSessionUser())) {
    return jsonError(401, "Unauthorized");
  }
  if (!isSameOrigin(request)) {
    return jsonError(403, "Forbidden");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Invalid upload");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "Choose an image to upload");
  }
  if (file.size <= 0 || file.size > imageLimit()) {
    return jsonError(400, "Image must be 5 MB or smaller");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!detectImageMime(buffer)) {
    return jsonError(400, "Use a JPG, PNG, WebP, or AVIF image");
  }

  try {
    const uploaded = await uploadProjectImage(buffer);
    return Response.json(uploaded);
  } catch {
    return jsonError(500, "Upload failed");
  }
}
