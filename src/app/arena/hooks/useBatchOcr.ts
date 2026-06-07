import { engines, SAMPLE_FILES } from "../utils/ocrConstants";

export function useBatchOcr(
  state: {
    isRunning: boolean;
    isBatchRunning: boolean;
    setIsBatchRunning: (running: boolean) => void;
    batchStatus: string;
    setBatchStatus: (status: any) => void;
    batchStatusRef: React.MutableRefObject<any>;
    setBatchCurrentIndex: (idx: number) => void;
    setBatchCurrentEngineIndex: (idx: number) => void;
    setBatchSuccessCount: React.Dispatch<React.SetStateAction<number>>;
    setBatchFailureCount: React.Dispatch<React.SetStateAction<number>>;
    setBatchElapsedTime: React.Dispatch<React.SetStateAction<number>>;
    setBatchStartTime: (time: number) => void;
    setBatchResults: React.Dispatch<React.SetStateAction<any>>;
    batchSize: number;
    visibleEngines: string[];
  },
  fetchAnalytics: () => Promise<void>
) {
  const startBatchOCR = async () => {
    if (state.isRunning || state.isBatchRunning) return;

    const enginesToRun = engines.filter(e => state.visibleEngines.includes(e.id));
    if (enginesToRun.length === 0) {
      alert("No visible engines selected. Please enable at least one engine in the filter.");
      return;
    }

    state.setIsBatchRunning(true);
    state.setBatchStatus("running");
    state.batchStatusRef.current = "running";
    state.setBatchCurrentIndex(0);
    state.setBatchCurrentEngineIndex(0);
    state.setBatchSuccessCount(0);
    state.setBatchFailureCount(0);
    state.setBatchElapsedTime(0);

    const startTime = Date.now();
    state.setBatchStartTime(startTime);

    const initialBatchResults: Record<string, Record<string, "pending" | "processing" | "done" | "failed">> = {};
    SAMPLE_FILES.forEach(filename => {
      initialBatchResults[filename] = {};
      enginesToRun.forEach(eng => {
        initialBatchResults[filename][eng.id] = "pending";
      });
    });
    state.setBatchResults(initialBatchResults);

    const timerInterval = setInterval(() => {
      if (state.batchStatusRef.current === "running") {
        state.setBatchElapsedTime(prev => prev + 1);
      }
    }, 1000);

    try {
      const chunks: string[][] = [];
      for (let i = 0; i < SAMPLE_FILES.length; i += state.batchSize) {
        chunks.push(SAMPLE_FILES.slice(i, i + state.batchSize));
      }

      for (let c = 0; c < chunks.length; c++) {
        if (state.batchStatusRef.current === "cancelled") break;
        const currentChunk = chunks[c];

        await Promise.all(
          currentChunk.map(async (filename) => {
            const fileIdx = SAMPLE_FILES.indexOf(filename);

            for (let j = 0; j < enginesToRun.length; j++) {
              const engine = enginesToRun[j];

              while (state.batchStatusRef.current === "paused") {
                await new Promise(resolve => setTimeout(resolve, 300));
              }

              if (state.batchStatusRef.current === "cancelled") break;

              state.setBatchResults((prev: any) => ({
                ...prev,
                [filename]: {
                  ...prev[filename],
                  [engine.id]: "processing"
                }
              }));

              state.setBatchCurrentIndex(fileIdx);
              state.setBatchCurrentEngineIndex(j);

              try {
                const res = await fetch("/api/arena", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ engine: engine.id, image: `/arena/${filename}`, filename })
                });

                if (state.batchStatusRef.current === "cancelled") break;

                if (!res.ok) throw new Error("Request failed");
                const data = await res.json();

                if (state.batchStatusRef.current === "cancelled") break;

                if (data.success) {
                  state.setBatchSuccessCount(prev => prev + 1);
                  state.setBatchResults((prev: any) => ({
                    ...prev,
                    [filename]: {
                      ...prev[filename],
                      [engine.id]: "done"
                    }
                  }));
                } else {
                  state.setBatchFailureCount(prev => prev + 1);
                  state.setBatchResults((prev: any) => ({
                    ...prev,
                    [filename]: {
                      ...prev[filename],
                      [engine.id]: "failed"
                    }
                  }));
                }
              } catch (err) {
                if (state.batchStatusRef.current === "cancelled") break;
                state.setBatchFailureCount(prev => prev + 1);
                state.setBatchResults((prev: any) => ({
                  ...prev,
                  [filename]: {
                    ...prev[filename],
                    [engine.id]: "failed"
                  }
                }));
              }
            }
          })
        );
      }

      if (state.batchStatusRef.current === "running") {
        state.setBatchStatus("completed");
        state.batchStatusRef.current = "completed";
      }
    } catch (error) {
      console.error("Batch OCR run error:", error);
    } finally {
      clearInterval(timerInterval);
      fetchAnalytics();
    }
  };

  const handlePauseBatch = () => {
    state.setBatchStatus("paused");
    state.batchStatusRef.current = "paused";
  };

  const handleResumeBatch = () => {
    state.setBatchStatus("running");
    state.batchStatusRef.current = "running";
  };

  const handleCancelBatch = () => {
    state.setBatchStatus("cancelled");
    state.batchStatusRef.current = "cancelled";
  };

  const handleCloseBatchModal = () => {
    state.setIsBatchRunning(false);
    state.setBatchStatus("idle");
    state.batchStatusRef.current = "idle";
  };

  return {
    startBatchOCR,
    handlePauseBatch,
    handleResumeBatch,
    handleCancelBatch,
    handleCloseBatchModal
  };
}
