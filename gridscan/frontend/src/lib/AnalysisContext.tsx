import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { ApiError, getAnalysis, getPointCloud, uploadAndAnalyze, type AnalysisResult, type PointCloudResponse } from "./api";

type Status = "idle" | "uploading" | "processing" | "complete" | "error";

interface AnalysisContextValue {
  status: Status;
  error: string | null;
  fileMeta: { name: string; size: number } | null;
  result: AnalysisResult | null;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
  fetchPointCloud: (opts?: { classes?: number[]; maxPoints?: number }) => Promise<PointCloudResponse>;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const analyze = useCallback(async (file: File) => {
    setStatus("uploading");
    setError(null);
    setFileMeta({ name: file.name, size: file.size });
    setResult(null);
    try {
      const { analysis_id } = await uploadAndAnalyze(file);
      setStatus("processing");
      const full = await getAnalysis(analysis_id);
      if (full.status === "failed") {
        setError(full.error ?? "Analysis failed for an unknown reason.");
        setStatus("error");
        return;
      }
      setResult(full);
      setStatus("complete");
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : "Could not reach the GridScan analysis backend. Is it running?";
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setFileMeta(null);
    setResult(null);
  }, []);

  const fetchPointCloud = useCallback(
    (opts?: { classes?: number[]; maxPoints?: number }) => {
      if (!result) return Promise.reject(new Error("No analysis loaded yet."));
      return getPointCloud(result.analysis_id, opts);
    },
    [result]
  );

  const value = useMemo(
    () => ({ status, error, fileMeta, result, analyze, reset, fetchPointCloud }),
    [status, error, fileMeta, result, analyze, reset, fetchPointCloud]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within an AnalysisProvider");
  return ctx;
}
