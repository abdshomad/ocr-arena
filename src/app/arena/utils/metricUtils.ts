export function levenshteinDistance(a: string | string[], b: string | string[]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;

  let prevRow = Array.from({ length: m + 1 }, (_, i) => i);
  let currRow = new Array(m + 1);

  for (let i = 1; i <= n; i++) {
    currRow[0] = i;
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,       // Deletion
        currRow[j - 1] + 1,   // Insertion
        prevRow[j - 1] + cost // Substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  return prevRow[m];
}

export function calculateCER(gt: string, ocr: string): number {
  if (!gt) return ocr ? 1 : 0;
  const dist = levenshteinDistance(gt, ocr);
  return dist / gt.length;
}

export function calculateWER(gt: string, ocr: string): number {
  const tokenize = (text: string) => text.trim().split(/\s+/).filter(Boolean);
  const gtWords = tokenize(gt);
  const ocrWords = tokenize(ocr);
  if (gtWords.length === 0) return ocrWords.length > 0 ? 1 : 0;
  const dist = levenshteinDistance(gtWords, ocrWords);
  return dist / gtWords.length;
}
