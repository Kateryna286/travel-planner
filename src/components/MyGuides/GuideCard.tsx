"use client";

import { useState } from "react";
import type { SavedGuide } from "@/lib/guides-storage";

interface Props {
  guide: SavedGuide;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDate(iso);
}

const SAFETY_PILL: Record<string, string> = {
  RED: "bg-red-100 text-red-700 border-red-200",
  ORANGE: "bg-amber-100 text-amber-700 border-amber-200",
  GREEN: "bg-green-100 text-green-700 border-green-200",
};

export default function GuideCard({ guide, onView, onDownload, onDelete }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const safetyLevel = guide.report.safety.level;
  const groupDesc =
    guide.groupSize.children > 0
      ? `${guide.groupSize.adults} adult${guide.groupSize.adults > 1 ? "s" : ""}, ${guide.groupSize.children} child${guide.groupSize.children > 1 ? "ren" : ""} · ${guide.groupType}`
      : `${guide.groupSize.adults} traveller${guide.groupSize.adults > 1 ? "s" : ""} · ${guide.groupType}`;

  async function handleDownload() {
    setDownloading(true);
    onDownload();
    setTimeout(() => setDownloading(false), 3000);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top row: destination + safety badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">
          {guide.destination}
        </h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${SAFETY_PILL[safetyLevel]}`}
        >
          {safetyLevel}
        </span>
      </div>

      {/* Trip details */}
      <div className="space-y-1 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-700">
            {formatDate(guide.departureDate)}
          </span>
          {" — "}
          <span className="font-medium text-gray-700">
            {formatDate(guide.returnDate)}
          </span>
        </p>
        <p>{groupDesc}</p>
      </div>

      {/* Guide ID + created */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <code className="font-mono">{guide.id}</code>
        <span title={new Date(guide.createdAt).toLocaleString()}>
          {relativeTime(guide.createdAt)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <button
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          View
        </button>

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
          {downloading ? "Downloading…" : "PDF"}
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-gray-500">Delete this guide?</span>
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
