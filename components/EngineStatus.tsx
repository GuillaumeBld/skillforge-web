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
    <div role="alert" className="bg-red-50 border-b border-red-200 text-red-700 text-xs text-center py-2.5 px-4 font-medium">
      ⚠️ SkillForge engine is not running —{" "}
      <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">make run</code>{" "}
      in the <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">skillforge/</code> directory
    </div>
  );
}
