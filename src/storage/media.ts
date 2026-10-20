import { imageDimensions } from "./image-dimensions";
import type { Asset } from "../domain/model";
import { uid } from "../domain/model";
export async function imageAsset(
  file: File,
  projectId: string,
): Promise<Asset> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 10 * 1024 * 1024
  )
    throw Error("Use PNG, JPEG or WebP up to 10 MiB.");
  imageDimensions(new Uint8Array(await file.arrayBuffer()));
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  bitmap.close();
  if (width * height > 24000000) throw Error("Image exceeds 24 megapixels.");
  return {
    id: uid(),
    projectId,
    kind: "image",
    name: file.name,
    mime: file.type,
    blob: file,
    width,
    height,
  };
}
export async function audioAsset(
  file: File,
  projectId: string,
): Promise<Asset> {
  if (file.size > 50 * 1024 * 1024) throw Error("Audio exceeds 50 MiB.");
  if (!/\.(wav|mp3)$/i.test(file.name))
    throw Error("Use a WAV or MP3 audio file.");
  const url = URL.createObjectURL(file);
  try {
    const duration = await new Promise<number>((resolve, reject) => {
      const el = new Audio();
      el.preload = "metadata";
      const timer = setTimeout(() => {
        el.removeAttribute("src");
        el.load();
        reject(Error("Audio metadata timed out"));
      }, 10000);
      el.onloadedmetadata = () => {
        clearTimeout(timer);
        const d = el.duration;
        el.removeAttribute("src");
        el.load();
        if (Number.isFinite(d) && d > 0) resolve(d);
        else reject(Error("Invalid audio duration"));
      };
      el.onerror = () => {
        clearTimeout(timer);
        reject(Error("Cannot decode this audio file"));
      };
      el.src = url;
    });
    return {
      id: uid(),
      projectId,
      kind: "audio",
      name: file.name,
      mime: file.type || "audio/wav",
      blob: file,
      duration,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
