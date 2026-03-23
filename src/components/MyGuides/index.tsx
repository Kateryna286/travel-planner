"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { SavedGuide } from "@/lib/guides-storage";
import type { PendingReport } from "@/app/page";
import { generateGuideId } from "@/lib/pdf-generator";
import GuideCard from "./GuideCard";
import GalleryRow from "./GalleryRow";
import TravelReportComponent from "@/components/TravelReport";

const PAGE_SIZE = 9;

type SortKey = "newest" | "oldest" | "destination";
type View = "grid" | "expanded";

interface Props {
  guides: SavedGuide[];
  pendingReport: PendingReport | null;
  onSavePending: (guide: SavedGuide) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDownload: (guide: SavedGuide) => void;
}

export default function MyGuidesPage({
  guides,
  pendingReport,
  onSavePending,
  onDelete,
  onDownload,
}: Props) {
  const [userView, setUserView] = useState<View>("grid");
  const [userSelectedGuideId, setUserSelectedGuideId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  // Pre-compute the guide ID the pending report would receive when saved
  const pendingGuideId = useMemo(
    () =>
      pendingReport
        ? generateGuideId(
            pendingReport.formData.destination,
            pendingReport.formData.departureDate
          )
        : null,
    [pendingReport]
  );

  // Derive effective view: auto-expand when a pending report arrives
  const view: View = pendingReport ? "expanded" : userView;

  // Derive effective selectedGuideId: clear if the selected guide no longer exists
  const selectedGuideId: string | null = (() => {
    if (pendingReport) return null; // show pending report
    if (
      userSelectedGuideId &&
      !guides.find((g) => g.id === userSelectedGuideId)
    ) {
      return null;
    }
    return userSelectedGuideId;
  })();

  // ── Filtered + sorted guides ───────────────────────────────────────────────
  const filteredGuides = useMemo(() => {
    let result = [...guides];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((g) =>
        g.destination.toLowerCase().includes(q)
      );
    }
    if (sort === "newest") result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else if (sort === "oldest") result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else result.sort((a, b) => a.destination.localeCompare(b.destination));
    return result;
  }, [guides, search, sort]);

  const totalPages = Math.ceil(filteredGuides.length / PAGE_SIZE);
  const pageGuides = filteredGuides.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleSavePending() {
    if (!pendingReport || !pendingGuideId) return;
    const guide: SavedGuide = {
      id: pendingGuideId,
      destination: pendingReport.destination,
      departureDate: pendingReport.formData.departureDate,
      returnDate: pendingReport.formData.returnDate,
      groupType: pendingReport.formData.group.type,
      groupSize: {
        adults: pendingReport.formData.group.adults,
        children: pendingReport.formData.group.children,
      },
      report: pendingReport.report,
      formData: pendingReport.formData,
      createdAt: new Date().toISOString(),
    };
    await onSavePending(guide);    // parent saves to storage + clears pendingReport
    setUserSelectedGuideId(pendingGuideId); // switch to showing the newly saved guide
  }

  function handleSelectGuide(id: string) {
    setUserSelectedGuideId(id);
    setUserView("expanded");
  }

  function handleBackToGrid() {
    setUserView("grid");
    setUserSelectedGuideId(null);
  }

  async function handleDeleteSelected() {
    if (!selectedGuideId) return;
    const remaining = guides.filter((g) => g.id !== selectedGuideId);
    await onDelete(selectedGuideId);
    if (remaining.length > 0) {
      setUserSelectedGuideId(remaining[0].id);
    } else {
      setUserView("grid");
      setUserSelectedGuideId(null);
    }
  }

  const selectedGuide = selectedGuideId
    ? (guides.find((g) => g.id === selectedGuideId) ?? null)
    : null;

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <LayoutGroup id="my-guides">
      <AnimatePresence mode="wait" initial={false}>

        {/* ── GRID VIEW ───────────────────────────────────────────────────── */}
        {view === "grid" && (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            {/* Search + sort */}
            {guides.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-gray-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by destination…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value as SortKey); setPage(1); }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="destination">Destination A–Z</option>
                </select>
              </div>
            )}

            {/* Empty / no-match states */}
            {guides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
                <p className="mb-3 text-4xl">🗺️</p>
                <p className="text-base font-medium text-gray-700">No guides saved yet</p>
                <p className="mt-1 text-sm text-gray-500">
                  Generate a travel guide on the New Guide tab, then save it here.
                </p>
              </div>
            ) : filteredGuides.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
                <p className="text-sm text-gray-500">No guides match &quot;{search}&quot;</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {pageGuides.map((guide) => (
                      <motion.div
                        key={guide.id}
                        layoutId={`gc-${guide.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      >
                        <GuideCard
                          guide={guide}
                          variant="grid"
                          onClick={() => handleSelectGuide(guide.id)}
                          onDownload={() => onDownload(guide)}
                          onDelete={() => onDelete(guide.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── EXPANDED VIEW ────────────────────────────────────────────────── */}
        {view === "expanded" && (
          <motion.div
            key="expanded-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-5"
          >
            {/* Sticky gallery row */}
            <GalleryRow
              guides={guides}
              selectedId={selectedGuideId}
              onSelect={(id) => setUserSelectedGuideId(id)}
              onBack={handleBackToGrid}
            />

            {/* Report area — cross-fades when selectedGuideId changes */}
            <AnimatePresence mode="wait" initial={false}>

              {/* Pending (unsaved) report */}
              {!selectedGuideId && pendingReport && (
                <motion.div
                  key="pending-report"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TravelReportComponent
                    report={pendingReport.report}
                    destination={pendingReport.destination}
                    formData={pendingReport.formData}
                    savedGuideId={null}
                    onSave={handleSavePending}
                    animateIn={true}
                  />
                </motion.div>
              )}

              {/* Saved guide report */}
              {selectedGuideId && selectedGuide && (
                <motion.div
                  key={`guide-${selectedGuideId}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Thin toolbar: guide ID + delete */}
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2">
                    <code className="text-xs text-gray-400 font-mono truncate">
                      {selectedGuide.id}
                    </code>
                    <button
                      onClick={handleDeleteSelected}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete guide
                    </button>
                  </div>
                  <TravelReportComponent
                    report={selectedGuide.report}
                    destination={selectedGuide.destination}
                    formData={selectedGuide.formData}
                    savedGuideId={selectedGuide.id}
                  />
                </motion.div>
              )}

              {/* Nothing to show */}
              {view === "expanded" && !pendingReport && !selectedGuide && (
                <motion.div
                  key="expanded-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center"
                >
                  <p className="text-sm text-gray-500">Select a guide from the row above.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

      </AnimatePresence>
    </LayoutGroup>
  );
}
