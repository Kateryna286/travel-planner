"use client";

import { useState, useEffect } from "react";
import { getGuides } from "@/lib/guides-storage";
import type { SavedGuide } from "@/lib/guides-storage";

const DISMISSED_KEY = "guidesImportDismissed";

interface Props {
  onImport: (guide: SavedGuide) => Promise<void>;
}

export function MigrationBanner({ onImport }: Props) {
  const [localGuides, setLocalGuides] = useState<SavedGuide[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const guides = getGuides();
    if (guides.length > 0) setLocalGuides(guides);
  }, []);

  if (localGuides.length === 0 || done) return null;

  async function handleImport() {
    setImporting(true);
    const remaining = [...localGuides];
    for (const guide of localGuides) {
      try {
        await onImport(guide);
        // Remove each guide from localStorage only after successful save
        const stored = localStorage.getItem("travelGuides");
        if (stored) {
          const all = JSON.parse(stored) as SavedGuide[];
          localStorage.setItem(
            "travelGuides",
            JSON.stringify(all.filter((g) => g.id !== guide.id))
          );
        }
        remaining.splice(remaining.indexOf(guide), 1);
      } catch {
        // leave failed guides in localStorage — retry on next sign-in
      }
    }
    if (remaining.length === 0) {
      localStorage.setItem(DISMISSED_KEY, "1");
      setDone(true);
    } else {
      setLocalGuides(remaining);
    }
    setImporting(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setLocalGuides([]);
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
      <span className="text-blue-800">
        You have {localGuides.length} guide{localGuides.length !== 1 ? "s" : ""} saved locally — import them to your account?
      </span>
      <div className="ml-4 flex shrink-0 gap-2">
        <button
          onClick={handleImport}
          disabled={importing}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import"}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
