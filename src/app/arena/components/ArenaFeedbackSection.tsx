import React from "react";

interface ArenaFeedbackSectionProps {
  engineId: string;
  isAccurate: boolean | null;
  isLoved: boolean | null;
  ratingStars: number | null;
  initialOcrRemarks: string | null;
  isFast: boolean | null;
  onSubmitFeedback: (updates: {
    isAccurate?: boolean | null;
    isLoved?: boolean | null;
    ratingStars?: number | null;
    ocrRemarks?: string | null;
    isFast?: boolean | null;
  }) => Promise<void>;
}

export const ArenaFeedbackSection: React.FC<ArenaFeedbackSectionProps> = ({
  engineId,
  isAccurate,
  isLoved,
  ratingStars,
  initialOcrRemarks,
  isFast,
  onSubmitFeedback
}) => {
  const [ocrRemarks, setOcrRemarks] = React.useState<string>("");

  React.useEffect(() => {
    setOcrRemarks(initialOcrRemarks ?? "");
  }, [initialOcrRemarks]);

  const handleBlurOrEnter = () => {
    onSubmitFeedback({ ocrRemarks });
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800/80 flex-none flex flex-col">
      {/* Feedback widgets */}
      <div className="px-3 py-2 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between gap-2 select-none text-[10px] text-slate-500">
        {/* Accuracy Thumbs up/down */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mr-1">Accuracy:</span>
          <button
            onClick={() => onSubmitFeedback({ isAccurate: isAccurate === true ? null : true })}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              isAccurate === true ? "text-emerald-500 font-extrabold scale-110" : "text-slate-400"
            }`}
            title="Accurate"
            id={`btn-accurate-yes-${engineId}`}
          >
            👍
          </button>
          <button
            onClick={() => onSubmitFeedback({ isAccurate: isAccurate === false ? null : false })}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
              isAccurate === false ? "text-rose-500 font-extrabold scale-110" : "text-slate-400"
            }`}
            title="Not Accurate"
            id={`btn-accurate-no-${engineId}`}
          >
            👎
          </button>
        </div>

        {/* Stars (1-5) */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => onSubmitFeedback({ ratingStars: ratingStars === star ? null : star })}
              className={`p-0.5 hover:scale-125 transition-transform cursor-pointer text-xs ${
                ratingStars !== null && ratingStars !== undefined && star <= ratingStars 
                  ? "text-amber-500" 
                  : "text-slate-300 dark:text-slate-700"
              }`}
              title={`Rate ${star} star${star > 1 ? "s" : ""}`}
              id={`btn-star-${star}-${engineId}`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Fastness (Fast / Slow) */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mr-1">Speed:</span>
          <button
            onClick={() => onSubmitFeedback({ isFast: isFast === true ? null : true })}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer ${
              isFast === true ? "opacity-100 scale-110 bg-slate-200 dark:bg-slate-800" : "opacity-40 grayscale"
            }`}
            title="Fast"
            id={`btn-fast-${engineId}`}
          >
            ⚡
          </button>
          <button
            onClick={() => onSubmitFeedback({ isFast: isFast === false ? null : false })}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer ${
              isFast === false ? "opacity-100 scale-110 bg-slate-200 dark:bg-slate-800" : "opacity-40 grayscale"
            }`}
            title="Slow"
            id={`btn-slow-${engineId}`}
          >
            <span className="text-[30px] inline-block align-middle leading-none">🐌</span>
          </button>
        </div>

        {/* Love / Hate */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSubmitFeedback({ isLoved: isLoved === true ? null : true })}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer ${
              isLoved === true ? "text-rose-500 font-extrabold scale-110 bg-slate-200 dark:bg-slate-800" : "text-slate-300 dark:text-slate-700"
            }`}
            title="Love"
            id={`btn-love-${engineId}`}
          >
            ♥
          </button>
          <button
            onClick={() => onSubmitFeedback({ isLoved: isLoved === false ? null : false })}
            className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer ${
              isLoved === false ? "opacity-100 scale-110 bg-slate-200 dark:bg-slate-800" : "opacity-40 grayscale"
            }`}
            title="Hate"
            id={`btn-hate-${engineId}`}
          >
            💔
          </button>
        </div>
      </div>

      {/* Remarks input */}
      <div className="px-3 pb-2 pt-0.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/30 flex items-center gap-1.5 select-text">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">Remarks:</span>
        <input
          type="text"
          value={ocrRemarks}
          onChange={(e) => setOcrRemarks(e.target.value)}
          onBlur={handleBlurOrEnter}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleBlurOrEnter();
              e.currentTarget.blur();
            }
          }}
          placeholder="Add remark..."
          className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0078d4]/50"
          id={`remarks-input-${engineId}`}
        />
      </div>
    </div>
  );
};
