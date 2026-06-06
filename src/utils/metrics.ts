export function levenshteinDistance(a: string | string[], b: string | string[]): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[a.length][b.length];
}

export function computeCER(reference: string, hypothesis: string): number {
  const ref = reference.trim();
  const hyp = hypothesis.trim();
  if (ref.length === 0) {
    return hyp.length === 0 ? 0 : 1;
  }
  const dist = levenshteinDistance(ref.split(""), hyp.split(""));
  return dist / ref.length;
}

export function computeWER(reference: string, hypothesis: string): number {
  const refWords = reference.trim().split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean);
  if (refWords.length === 0) {
    return hypWords.length === 0 ? 0 : 1;
  }
  const dist = levenshteinDistance(refWords, hypWords);
  return dist / refWords.length;
}
