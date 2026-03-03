// components/EngineStatus.tsx
"use client";
import { useEffect, useState } from "react";

export function EngineStatus() {
  const [status, setStatus] = useState<"ok" | "down" | "checking">("checking");

  useEffect(() => {
    fetch("/api/engine/health")
      .then((r) => setStatus(r.ok ? "ok" : "down"))
      .catch(() => setStatus("down"));
  }, []);

  if (status === "checking" || status === "ok") return null;

  return (
    <div className="bg-red-50 border-b border-red-200 text-red-700 text-sm text-center py-2 px-4">
      ⚠️ SkillForge engine is not running. Start it:{" "}
      <code className="bg-red-100 px-1 rounded">make run</code> in the skillforge/ directory.
    </div>
  );
}
