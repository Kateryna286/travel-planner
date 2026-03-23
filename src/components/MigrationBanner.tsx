"use client";

import { useState } from "react";
import { getGuides, deleteGuide } from "@/lib/guides-storage";
import type { SavedGuide } from "@/lib/guides-storage";

const DISMISSED_KEY = "guidesImportDismissed";

interface Props {
  onImport: (guide: SavedGuide) => Promise<void>;
}

export function MigrationBanner({ onImport }: Props) {
  const [localGuides, setLocalGuides] = useState<SavedGuide[]>(() => {
    if (typeof window === "undefined") return [];
    if (localStorage.getItem(DISMISSED_KEY)) return [];
    return getGuides();
  });
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(false);

  if (localGuides.length === 0) return null;

  async function handleImport() {
    setImporting(true);
    setImportError(false);
    let remaining = [...localGuides];
    for (const guide of localGuides) {
      try {
        await onImport(guide);
        deleteGuide(guide.id);
        remaining = remaining.filter((g) => g.id !== guide.id);
      } catch {
        // leave failed guides in localStorage — retry on next sign-in
      }
    }
    if (remaining.length === 0) {
      localStorage.setItem(DISMISSED_KEY, "1");
      setLocalGuides([]);
    } else {
      setImportError(true);
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
      <div>
        <span className="text-blue-800">
          You have {localGuides.length} guide{localGuides.length !== 1 ? "s" : ""} saved locally — import them to your account?
        </span>
        {importError && (
          <p className="mt-1 text-xs text-red-600">Some guides could not be imported — try again.</p>
        )}
      </div>
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
