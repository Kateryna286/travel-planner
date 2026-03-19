"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getGuides,
  saveGuide,
  deleteGuide,
  type SavedGuide,
} from "@/lib/guides-storage";

export function useGuides() {
  const [guides, setGuides] = useState<SavedGuide[]>([]);

  useEffect(() => {
    setGuides(getGuides());
  }, []);

  const save = useCallback((guide: SavedGuide) => {
    saveGuide(guide);
    setGuides(getGuides());
  }, []);

  const remove = useCallback((id: string) => {
    deleteGuide(id);
    setGuides((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return { guides, save, remove };
}
