"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { TravelReport } from "@/types/travel";
import type { TravelFormValues } from "@/lib/schemas";
import { useGuides } from "@/hooks/useGuides";
import TravelForm from "@/components/TravelForm";
import MyGuidesPage from "@/components/MyGuides";
import type { SavedGuide } from "@/lib/guides-storage";

type Tab = "new" | "guides";

export interface PendingReport {
  report: TravelReport;
  destination: string;
  formData: TravelFormValues;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [pendingReport, setPendingReport] = useState<PendingReport | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: session } = useSession();
  const router = useRouter();
  const { guides, save, remove } = useGuides();

  function handleReport(newReport: TravelReport, dest: string, data: TravelFormValues) {
    setPendingReport({ report: newReport, destination: dest, formData: data });
    setActiveTab("guides");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSavePending(guide: SavedGuide) {
    if (!session) {
      router.push("/auth/sign-in?callbackUrl=/");
      return;
    }
    try {
      setSaveError(null);
      await save(guide);
      setPendingReport(null);
    } catch {
      setSaveError("Failed to save guide — please try again.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove(id);
    } catch {
      // silent — guide stays in list
    }
  }

  async function handleDownload(guide: SavedGuide) {
    const { generateTravelPDF } = await import("@/lib/pdf-generator");
    generateTravelPDF(guide.report, guide.formData, guide.id);
  }

  const guideCount = guides.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">✈️ Travel Planner</h1>
            <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600">
              AI-generated travel guides — safety, attractions, food, and everything you need.
            </p>
          </div>

          {/* User menu */}
          <div className="shrink-0 ml-4 mt-1">
            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{session.user?.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <a
                href="/auth/sign-in"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign in
              </a>
            )}
          </div>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* Tab navigation */}
        <div className="mb-8 flex gap-1 rounded-xl bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "new"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ✈️ New Guide
          </button>
          <button
            onClick={() => setActiveTab("guides")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === "guides"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🗺️ My Guides
            {guideCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                {guideCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "new" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <TravelForm onReport={handleReport} />
          </div>
        ) : (
          <MyGuidesPage
            guides={guides}
            pendingReport={pendingReport}
            onSavePending={handleSavePending}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        )}
      </div>
    </main>
  );
}
