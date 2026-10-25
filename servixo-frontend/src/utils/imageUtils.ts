/**
 * Applies Cloudinary transformations (crop to 4:3 aspect ratio, auto format, auto quality)
 * to ensure responsive performance and prevent large image payloads.
 */
export function getTransformedImageUrl(url?: string, width = 800): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    if (url.includes("/upload/c_fill") || url.includes("/upload/f_auto")) {
      return url;
    }
    return url.replace("/upload/", `/upload/c_fill,ar_4:3,w_${width},f_auto,q_auto/`);
  }
  return url;
}
