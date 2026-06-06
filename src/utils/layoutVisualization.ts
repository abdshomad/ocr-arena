export function normalizeImageSrc(src: string): string {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return src;
  }
  return `data:image/png;base64,${src}`;
}

export interface LayoutPageResult {
  outputImages?: Record<string, string>;
}

/** Same visualization URL selection as Document Parser Visual Grid (second image if present, else first). */
export function extractLayoutVisUrl(page0: LayoutPageResult | null | undefined): string {
  const outImgs = page0?.outputImages || {};
  const sortedUrls = Object.values(outImgs).filter(Boolean) as string[];
  const visUrl = sortedUrls.length >= 2 ? sortedUrls[1] : sortedUrls[0] || "";
  return normalizeImageSrc(visUrl);
}

export function extractLayoutVisUrlFromResult(
  layoutParsingResult: { layoutParsingResults?: LayoutPageResult[] } | null | undefined
): string {
  const page0 = layoutParsingResult?.layoutParsingResults?.[0];
  return extractLayoutVisUrl(page0);
}
