export interface EngineResult {
  status: "pending" | "processing" | "done" | "failed";
  text: string;
  time: number;
  rawResult?: any;
}

export interface ResultsMap {
  nemotron: EngineResult;
  paddle: EngineResult;
  lightonocr: EngineResult;
  glm: EngineResult;
  dots: EngineResult;
  deepseek: EngineResult;
}

export const SAMPLE_FILES = [
  "vl1_6_1.png",
  "vl1_6_2.png",
  "vl1_6_3.png",
  "vl1_6_4.png",
  "vl1_6_5.png",
  "vl1_6_6.png",
  "vl1_6_7.png",
  "vl1_6_8.png",
  "vl1_6_9.png",
  "vl1_6_10.png",
  "vl1_6_11.png",
  "vl1_6_12.png"
];

export const engines = [
  { id: "nemotron", name: "Nemotron OCR v2", logo: "🟢" },
  { id: "paddle", name: "Paddle OCR VL 1.6", logo: "🏓" },
  { id: "lightonocr", name: "LightOnOCR-2-1B", logo: "⚡" },
  { id: "glm", name: "GLM-OCR", logo: "🧠" },
  { id: "dots", name: "Dots OCR", logo: "⚫" },
  { id: "deepseek", name: "DeepSeek OCR 2", logo: "🐳" }
] as const;

export type EngineId = typeof engines[number]["id"];

export const LABEL_COLORS: Record<string, { stroke: string; fill: string; badge: string }> = {
  text: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.08)", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  header: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.08)", badge: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  display_formula: { stroke: "#a855f7", fill: "rgba(168, 85, 247, 0.08)", badge: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
  inline_formula: { stroke: "#c084fc", fill: "rgba(192, 132, 252, 0.08)", badge: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" },
  table: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.08)", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  image: { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.08)", badge: "bg-pink-500/10 text-pink-400 border-pink-500/30" },
  number: { stroke: "#64748b", fill: "rgba(100, 116, 139, 0.08)", badge: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
  footer: { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.08)", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" }
};

export const DEFAULT_COLOR = { stroke: "#14b8a6", fill: "rgba(20, 184, 166, 0.08)", badge: "bg-teal-500/10 text-teal-400 border-teal-500/30" };

export const allLabels = ["text", "header", "display_formula", "inline_formula", "table", "image", "number", "footer"];

export const ENGINE_COLORS: Record<string, string> = {
  nemotron: "#10b981",
  paddle: "#f97316",
  lightonocr: "#8b5cf6",
  glm: "#3b82f6",
  dots: "#ec4899",
  deepseek: "#06b6d4"
};

export const ENGINE_DEFAULT_COLOR = "#64748b";

export const ENGINE_PRICING: Record<string, number> = {
  nemotron: 2.00,
  paddle: 0.10,
  lightonocr: 0.30,
  glm: 1.50,
  dots: 0.80,
  deepseek: 1.00
};

export interface DiffPart {
  type: "added" | "removed" | "equal";
  value: string;
}

export interface ZipFile {
  name: string;
  content: string;
}
