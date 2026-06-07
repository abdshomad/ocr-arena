import React from "react";
import { DocumentHistoryItem } from "../utils/historyHelpers";

interface HistoryLightboxFeedbackProps {
  previewItem: DocumentHistoryItem;
  onSubmitFeedback: (
    filename: string,
    engine: string,
    updates: {
      isAccurate?: boolean | null;
      isLoved?: boolean | null;
      ratingStars?: number | null;
      ocrRemarks?: string | null;
      isFast?: boolean | null;
    }
  ) => void;
}

export const HistoryLightboxFeedback: React.FC<HistoryLightboxFeedbackProps> = ({
  previewItem,
  onSubmitFeedback
}) => {
  const [ocrRemarks, setOcrRemarks] = React.useState<string>("");

  React.useEffect(() => {
    setOcrRemarks(previewItem.ocrRemarks ?? "");
  }, [previewItem.ocrRemarks]);

  const handleBlurOrEnter = () => {
    onSubmitFeedback(previewItem.filename, previewItem.engine, { ocrRemarks });
  };

  return (
    <div className="border border-slate-205 dark:border-slate-800/85 rounded-2xl overflow-hidden flex flex-col flex-none">
      {/* Feedback widgets */}
      <div className="bg-slate-55 dark:bg-slate-955 p-4 flex items-center justify-between gap-4 select-none">
        {/* Accuracy Thumbs */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-405 uppercase tracking-wider">Accuracy:</span>
          <button
            onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { isAccurate: previewItem.isAccurate === true ? null : true })}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs ${
              previewItem.isAccurate === true ? "text-emerald-500 font-extrabold scale-110 bg-slate-200 dark:bg-slate-800" : "text-slate-400"
            }`}
            title="Accurate"
            id={`lightbox-btn-accurate-yes`}
          >
            👍
          </button>
          <button
            onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { isAccurate: previewItem.isAccurate === false ? null : false })}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs ${
              previewItem.isAccurate === false ? "text-rose-500 font-extrabold scale-110 bg-slate-200 dark:bg-slate-800" : "text-slate-400"
            }`}
            title="Not Accurate"
            id={`lightbox-btn-accurate-no`}
          >
            👎
          </button>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Rating:</span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { ratingStars: previewItem.ratingStars === star ? null : star })}
                className={`p-1 hover:scale-125 transition-transform cursor-pointer text-sm ${
                  previewItem.ratingStars !== null && previewItem.ratingStars !== undefined && star <= previewItem.ratingStars 
                    ? "text-amber-500" 
                    : "text-slate-355 dark:text-slate-700"
                }`}
                title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                id={`lightbox-btn-star-${star}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Speed / Fastness */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Speed:</span>
          <button
            onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { isFast: previewItem.isFast === true ? null : true })}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer text-xs ${
              previewItem.isFast === true ? "opacity-100 scale-110 bg-slate-200 dark:bg-slate-800" : "opacity-40 grayscale"
            }`}
            title="Fast"
            id={`lightbox-btn-fast`}
          >
            ⚡
          </button>
          <button
            onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { isFast: previewItem.isFast === false ? null : false })}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer text-xs ${
              previewItem.isFast === false ? "opacity-100 scale-110 bg-slate-200 dark:bg-slate-800" : "opacity-40 grayscale"
            }`}
            title="Slow"
            id={`lightbox-btn-slow`}
          >
            <span className="text-[30px] inline-block align-middle leading-none">🐌</span>
          </button>
        </div>

        {/* Love / Hate Toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Rating:</span>
          <button
            onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { isLoved: previewItem.isLoved === true ? null : true })}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer text-sm ${
              previewItem.isLoved === true ? "text-rose-500 font-extrabold scale-110 bg-slate-200 dark:bg-slate-800" : "text-slate-355 dark:text-slate-755"
            }`}
            title="Love"
            id={`lightbox-btn-love`}
          >
            ♥
          </button>
          <button
            onClick={() => onSubmitFeedback(previewItem.filename, previewItem.engine, { isLoved: previewItem.isLoved === false ? null : false })}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:scale-110 cursor-pointer text-sm ${
              previewItem.isLoved === false ? "opacity-100 scale-110 bg-slate-200 dark:bg-slate-800" : "opacity-40 grayscale"
            }`}
            title="Hate"
            id={`lightbox-btn-hate`}
          >
            💔
          </button>
        </div>
      </div>

      {/* Remarks input */}
      <div className="px-4 pb-3 pt-0.5 bg-slate-55 dark:bg-slate-955 border-t border-slate-200/50 dark:border-slate-800/30 flex items-center gap-2 select-text">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Remarks:</span>
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
          placeholder="Add remark of the ocr result..."
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0078d4]/50"
          id={`lightbox-remarks-input`}
        />
      </div>
    </div>
  );
};
