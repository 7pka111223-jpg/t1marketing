"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="card empty">
      <div className="display empty-title">Something went wrong</div>
      <p className="empty-copy">{error.message || "This view could not load. The marketing schema may not be reachable yet."}</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  );
}
