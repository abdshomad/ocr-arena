import React from "react";

export function highlightText(text: string, query: string): React.ReactNode[] | string {
  if (!query) return text;
  const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-500/35 text-slate-900 dark:text-slate-100 px-0.5 rounded font-semibold dark:bg-yellow-500/25">
        {part}
      </mark>
    ) : (
      part
    )
  );
}
