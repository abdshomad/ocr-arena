import { DiffPart } from "./ocrConstants";

export function diffTokens(aTokens: string[], bTokens: string[]): DiffPart[] {
  const n = aTokens.length;
  const m = bTokens.length;
  
  if (n > 2000 || m > 2000) {
    return [
      { type: "removed", value: aTokens.join("") },
      { type: "added", value: bTokens.join("") }
    ];
  }
  
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (aTokens[i - 1] === bTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result: DiffPart[] = [];
  let i = n;
  let j = m;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aTokens[i - 1] === bTokens[j - 1]) {
      result.push({ type: "equal", value: aTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: "added", value: bTokens[j - 1] });
      j--;
    } else {
      result.push({ type: "removed", value: aTokens[i - 1] });
      i--;
    }
  }
  
  return result.reverse();
}

export function diffWords(textA: string, textB: string): DiffPart[] {
  const splitIntoLines = (text: string): string[] => {
    if (!text) return [];
    const normalized = text.replace(/\r\n/g, "\n");
    const lines: string[] = [];
    let current = "";
    for (let i = 0; i < normalized.length; i++) {
      current += normalized[i];
      if (normalized[i] === '\n') {
        lines.push(current);
        current = "";
      }
    }
    if (current) {
      lines.push(current);
    }
    return lines;
  };

  const aLines = splitIntoLines(textA || "");
  const bLines = splitIntoLines(textB || "");

  const lineDiffs = diffTokens(aLines, bLines);
  const finalResult: DiffPart[] = [];
  
  let idx = 0;
  while (idx < lineDiffs.length) {
    if (lineDiffs[idx].type === "equal") {
      finalResult.push({ type: "equal", value: lineDiffs[idx].value });
      idx++;
    } else {
      let removedText = "";
      let addedText = "";
      while (idx < lineDiffs.length && lineDiffs[idx].type !== "equal") {
        if (lineDiffs[idx].type === "removed") {
          removedText += lineDiffs[idx].value;
        } else if (lineDiffs[idx].type === "added") {
          addedText += lineDiffs[idx].value;
        }
        idx++;
      }
      
      const tokenizeWords = (text: string) => text.split(/(\s+)/);
      const aWordTokens = tokenizeWords(removedText);
      const bWordTokens = tokenizeWords(addedText);
      
      const wordDiffs = diffTokens(aWordTokens, bWordTokens);
      for (const part of wordDiffs) {
        finalResult.push(part);
      }
    }
  }
  
  return finalResult;
}
