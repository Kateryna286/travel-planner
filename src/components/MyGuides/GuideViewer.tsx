"use client";

import { useState, useEffect } from "react";
import type { SavedGuide } from "@/lib/guides-storage";
import SafetyBanner from "@/components/TravelReport/SafetyBanner";
import Attractions from "@/components/TravelReport/Attractions";
import Cuisine from "@/components/TravelReport/Cuisine";
import PracticalInfo from "@/components/TravelReport/PracticalInfo";

interface Props {
  guide: SavedGuide;
  onClose: () => void;
  onDownload: () => void;
}

export default function GuideViewer({ guide, onClose, onDownload }: Props) {
  const [acknowledged, setAcknowledged] = useState(
    guide.report.safety.level !== "RED"
  );
  const [downloading, setDownloading] = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleDownload() {
    setDownloading(true);
    onDownload();
    setTimeout(() => setDownloading(false), 3000);
  }

  const blocked = guide.report.safety.level === "RED" && !acknowledged;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative mt-8 mb-8 w-full max-w-3xl mx-4 rounded-2xl bg-white shadow-2xl flex flex-col max-h-[calc(100vh-4rem)] overflow-hidden">

        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {guide.destination}
            </h2>
            <code className="text-xs text-gray-400 font-mono">{guide.id}</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {downloading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              {downloading ? "Downloading…" : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8">
          <SafetyBanner
            safety={guide.report.safety}
            acknowledged={acknowledged}
            onAcknowledge={() => setAcknowledged(true)}
          />
          {!blocked && (
            <>
              <Attractions attractions={guide.report.attractions} />
              <hr className="border-gray-200" />
              <Cuisine cuisine={guide.report.cuisine} />
              <hr className="border-gray-200" />
              <PracticalInfo practical={guide.report.practical} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
