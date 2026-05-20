// Unsplash covers carry sizing in the query string; request a crisper render for the UI.
export function coverAt(url: string | null | undefined, size: number): string | undefined {
  if (!url) return undefined;
  if (url.includes("images.unsplash.com")) {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    params.set("w", String(size));
    params.set("h", String(size));
    params.set("fit", "crop");
    params.set("q", "80");
    return `${base}?${params.toString()}`;
  }
  return url;
}

// Landscape variant for wide cards (sync cases, banners).
export function coverWide(url: string | null | undefined, width: number, height: number): string | undefined {
  if (!url) return undefined;
  if (url.includes("images.unsplash.com")) {
    const [base, query = ""] = url.split("?");
    const params = new URLSearchParams(query);
    params.set("w", String(width));
    params.set("h", String(height));
    params.set("fit", "crop");
    params.set("q", "80");
    return `${base}?${params.toString()}`;
  }
  return url;
}
