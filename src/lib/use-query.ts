"use client";

import { useEffect, useState } from "react";

type Result<T> = { key: string; data: T } | { key: string; error: true };

export function useQuery<T>(key: string, load: () => Promise<T>) {
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setResult({ key, data });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [key, load]);

  if (!result || result.key !== key) {
    return { phase: "loading" as const, data: null };
  }
  if ("error" in result) {
    return { phase: "error" as const, data: null };
  }
  return { phase: "ready" as const, data: result.data };
}
