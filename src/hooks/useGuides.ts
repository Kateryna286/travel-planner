"use client";

import { useState, useEffect, useCallback } from "react";
import type { SavedGuide } from "@/lib/guides-storage";

export function useGuides() {
  const [guides, setGuides] = useState<SavedGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGuides() {
      try {
        const res = await fetch("/api/guides");
        if (res.status === 401) {
          // Not signed in — empty guides, not an error
          setGuides([]);
          return;
        }
        if (!res.ok) throw new Error("Failed to load guides");
        const data = await res.json();
        setGuides(data.guides ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, []);

  const save = useCallback(async (guide: SavedGuide): Promise<void> => {
    const res = await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guide),
    });
    if (!res.ok) throw new Error("Failed to save guide");
    setGuides((prev) => [guide, ...prev]);
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/guides/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete guide");
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return { guides, save, remove, loading, error };
}
