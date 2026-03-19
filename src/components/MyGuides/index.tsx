"use client";

import { useState, useMemo } from "react";
import type { SavedGuide } from "@/lib/guides-storage";
import GuideCard from "./GuideCard";
import GuideViewer from "./GuideViewer";

interface Props {
  guides: SavedGuide[];
  onDelete: (id: string) => void;
  onDownload: (guide: SavedGuide) => void;
}

type SortKey = "newest" | "oldest" | "destination";

export default function MyGuidesPage({ guides, onDelete, onDownload }: Props) {
  const [viewingGuide, setViewingGuide] = useState<SavedGuide | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    let result = [...guides];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) =>
        g.destination.toLowerCase().includes(q)
      );
    }

    if (sort === "newest") {
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "oldest") {
      result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    } else {
      result.sort((a, b) => a.destination.localeCompare(b.destination));
    }

    return result;
  }, [guides, search, sort]);

  return (
    <>
      <div className="space-y-6">
        {/* Controls */}
        {guides.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by destination…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="destination">Destination A–Z</option>
            </select>
          </div>
        )}

        {/* List */}
        {guides.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
            <p className="text-4xl mb-3">🗺️</p>
            <p className="text-base font-medium text-gray-700">No guides saved yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Generate a travel guide and click "Save Guide" to keep it here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
            <p className="text-sm text-gray-500">No guides match "{search}"</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                onView={() => setViewingGuide(guide)}
                onDownload={() => onDownload(guide)}
                onDelete={() => onDelete(guide.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Guide viewer modal */}
      {viewingGuide && (
        <GuideViewer
          guide={viewingGuide}
          onClose={() => setViewingGuide(null)}
          onDownload={() => onDownload(viewingGuide)}
        />
      )}
    </>
  );
}
