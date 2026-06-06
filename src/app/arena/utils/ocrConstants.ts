export interface EngineResult {
  status: "pending" | "processing" | "done" | "failed";
  text: string;
  time: number;
  rawResult?: any;
}

export interface ResultsMap {
  [key: string]: EngineResult;
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
  { id: "deepseek", name: "DeepSeek OCR 2", logo: "🐳" },
  { id: "chandra", name: "Chandra OCR 2", logo: "🌙" },
  { id: "gemma4", name: "Gemma 4", logo: "💎" },
  { id: "qwen3vl", name: "Qwen3-VL", logo: "🎈" },
  { id: "litparse", name: "LiteParse", logo: "📄" },
  { id: "mineru-diffusion", name: "MinerU-Diffusion", logo: "⚒️" },
  { id: "lightonocr-original", name: "Light On OCR Original", logo: "💡" },
  { id: "docowl", name: "Doc OWL", logo: "🦉" },
  { id: "phi4-ocr", name: "Phi 4 OCR", logo: "🎛️" },
  { id: "smol-docling", name: "Smol Docling OCR", logo: "🦦" },
  { id: "granite-docling", name: "IBM Granite Docling", logo: "🪨" },
  { id: "aya-vision", name: "Aya Vision OCR", logo: "🌸" },
  { id: "dolphin", name: "Dolphin", logo: "🐬" },
  { id: "qwen3-omni", name: "Qwen3-Omni", logo: "🪐" },
  { id: "owlocr", name: "owlOCR", logo: "👀" },
  { id: "ocr-flux", name: "OCR Flux", logo: "🌊" },
  { id: "monkey-ocr", name: "Monkey OCR", logo: "🐒" },
  { id: "numarkdown", name: "Numarkdown OCR", logo: "🔢" },
  { id: "ocr-docker", name: "OCR Docker", logo: "🐳" },
  { id: "gemma3", name: "Gemma 3 OCR", logo: "💎" },
  { id: "falcon-ocr", name: "Falcon OCR", logo: "🦅" },
  { id: "dolphin-v2", name: "Dolphin v2", logo: "🐬" },
  { id: "youtu-vl", name: "Youtu-VL", logo: "📹" },
  { id: "pike-pdf", name: "Pike PDF", logo: "🐟" },
  { id: "openpage", name: "OpenPage", logo: "📖" },
  { id: "documagnet", name: "DocuMagnet", logo: "🧲" },
  { id: "hunyuan-ocr", name: "Hunyuan OCR", logo: "🐉" },
  { id: "colpali", name: "ColPali", logo: "📚" },
  { id: "pixl-passport", name: "Pixl (Passport OCR)", logo: "🛂" },
  { id: "nemotron-nano", name: "NVIDIA Nemotron Nano", logo: "🟢" },
  { id: "nemotron-3-super", name: "NVIDIA Nemotron 3 Super", logo: "🟢" },
  { id: "nemotron-3-ultra", name: "NVIDIA Nemotron 3 Ultra", logo: "🟢" },
  { id: "nemotron-omni", name: "NVIDIA Nemotron Omni", logo: "🟢" },
  { id: "minicpm-v-4-6", name: "MiniCPM-V 4.6", logo: "📸" },
  { id: "deepseek-v4", name: "DeepSeek V4 OCR", logo: "🐳" },
  { id: "paddle-vl-1-5", name: "PaddleOCR-VL-1.5", logo: "🏓" }
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
  deepseek: "#06b6d4",
  chandra: "#eab308",
  gemma4: "#ef4444",
  qwen3vl: "#ec4899",
  litparse: "#14b8a6",
  "mineru-diffusion": "#6366f1",
  "lightonocr-original": "#a78bfa",
  docowl: "#c084fc",
  "phi4-ocr": "#3b82f6",
  "smol-docling": "#10b981",
  "granite-docling": "#64748b",
  "aya-vision": "#ec4899",
  dolphin: "#06b6d4",
  "qwen3-omni": "#f59e0b",
  owlocr: "#14b8a6",
  "ocr-flux": "#ef4444",
  "monkey-ocr": "#f97316",
  numarkdown: "#8b5cf6",
  "ocr-docker": "#0284c7",
  gemma3: "#ef4444",
  "falcon-ocr": "#eab308",
  "dolphin-v2": "#06b6d4",
  "youtu-vl": "#e11d48",
  "pike-pdf": "#0ea5e9",
  openpage: "#10b981",
  documagnet: "#f43f5e",
  "hunyuan-ocr": "#8b5cf6",
  colpali: "#6366f1",
  "pixl-passport": "#f59e0b",
  "nemotron-nano": "#10b981",
  "nemotron-3-super": "#059669",
  "nemotron-3-ultra": "#047857",
  "nemotron-omni": "#065f46",
  "minicpm-v-4-6": "#c2410c",
  "deepseek-v4": "#0891b2",
  "paddle-vl-1-5": "#ea580c"
};

export const ENGINE_DEFAULT_COLOR = "#64748b";

export const ENGINE_PRICING: Record<string, number> = {
  nemotron: 2.00,
  paddle: 0.10,
  lightonocr: 0.30,
  glm: 1.50,
  dots: 0.80,
  deepseek: 1.00,
  chandra: 1.20,
  gemma4: 1.80,
  qwen3vl: 0.90,
  litparse: 0.40,
  "mineru-diffusion": 1.60,
  "lightonocr-original": 0.25,
  docowl: 1.10,
  "phi4-ocr": 1.30,
  "smol-docling": 0.15,
  "granite-docling": 0.12,
  "aya-vision": 1.40,
  dolphin: 1.25,
  "qwen3-omni": 1.70,
  owlocr: 0.95,
  "ocr-flux": 2.50,
  "monkey-ocr": 0.70,
  numarkdown: 1.85,
  "ocr-docker": 0.35,
  gemma3: 1.60,
  "falcon-ocr": 1.35,
  "dolphin-v2": 1.25,
  "youtu-vl": 1.45,
  "pike-pdf": 0.05,
  openpage: 0.20,
  documagnet: 0.50,
  "hunyuan-ocr": 2.10,
  colpali: 1.10,
  "pixl-passport": 0.65,
  "nemotron-nano": 0.50,
  "nemotron-3-super": 0.80,
  "nemotron-3-ultra": 1.50,
  "nemotron-omni": 2.20,
  "minicpm-v-4-6": 1.80,
  "deepseek-v4": 1.20,
  "paddle-vl-1-5": 0.15
};

export interface DiffPart {
  type: "added" | "removed" | "equal";
  value: string;
}

export interface ZipFile {
  name: string;
  content: string;
}
