"use client";

import { motion } from "framer-motion";
import type { SavedGuide } from "@/lib/guides-storage";
import GuideCard from "./GuideCard";

interface Props {
  guides: SavedGuide[];
  selectedId: string | null; // null = pending report selected
  onSelect: (id: string) => void;
  onBack: () => void;
}

export default function GalleryRow({ guides, selectedId, onSelect, onBack }: Props) {
  return (
    <div className="sticky top-0 z-20 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Back button */}
        <button
          onClick={onBack}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#214068]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="hidden sm:inline">Grid</span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px shrink-0 bg-gray-200" />

        {/* Scrollable guide cards */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-hide">
          {guides.map((guide) => (
            <motion.div
              key={guide.id}
              layoutId={`gc-${guide.id}`}
              layout
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <GuideCard
                guide={guide}
                variant="gallery"
                isSelected={guide.id === selectedId}
                onClick={() => onSelect(guide.id)}
              />
            </motion.div>
          ))}

          {guides.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No saved guides yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
