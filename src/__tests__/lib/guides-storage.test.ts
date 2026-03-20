import { getGuides, saveGuide, deleteGuide, guideExists } from "@/lib/guides-storage";
import type { SavedGuide } from "@/lib/guides-storage";

// Minimal SavedGuide fixture
function makeGuide(overrides: Partial<SavedGuide> = {}): SavedGuide {
  return {
    id: "TEST_200326_AA1111",
    destination: "Paris",
    departureDate: "2099-12-01",
    returnDate: "2099-12-10",
    groupType: "Solo",
    groupSize: { adults: 1, children: 0 },
    report: {} as SavedGuide["report"],
    formData: {} as SavedGuide["formData"],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe("getGuides", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(getGuides()).toEqual([]);
  });

  it("returns parsed guides from localStorage", () => {
    const guide = makeGuide();
    localStorage.setItem("travelGuides", JSON.stringify([guide]));
    expect(getGuides()).toHaveLength(1);
    expect(getGuides()[0].id).toBe("TEST_200326_AA1111");
  });

  it("returns empty array when localStorage contains invalid JSON", () => {
    localStorage.setItem("travelGuides", "not-json{{{");
    expect(getGuides()).toEqual([]);
  });
});

describe("saveGuide", () => {
  it("saves a guide to localStorage", () => {
    const guide = makeGuide();
    saveGuide(guide);
    expect(getGuides()).toHaveLength(1);
  });

  it("prepends new guide (newest first ordering)", () => {
    const older = makeGuide({ id: "OLDER" });
    const newer = makeGuide({ id: "NEWER" });
    saveGuide(older);
    saveGuide(newer);
    const guides = getGuides();
    expect(guides[0].id).toBe("NEWER");
    expect(guides[1].id).toBe("OLDER");
  });

  it("preserves the full report on the saved guide", () => {
    const guide = makeGuide({
      report: { safety: { level: "GREEN", headline: "Safe", summary: "", specificRisks: [] } } as SavedGuide["report"],
    });
    saveGuide(guide);
    expect(getGuides()[0].report.safety.level).toBe("GREEN");
  });
});

describe("deleteGuide", () => {
  it("removes the guide with the given id", () => {
    saveGuide(makeGuide({ id: "A" }));
    saveGuide(makeGuide({ id: "B" }));
    deleteGuide("A");
    const remaining = getGuides();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe("B");
  });

  it("is a no-op when id does not exist", () => {
    saveGuide(makeGuide({ id: "A" }));
    deleteGuide("NONEXISTENT");
    expect(getGuides()).toHaveLength(1);
  });
});

describe("guideExists", () => {
  it("returns true when guide is saved", () => {
    saveGuide(makeGuide({ id: "A" }));
    expect(guideExists("A")).toBe(true);
  });

  it("returns false when guide is not saved", () => {
    expect(guideExists("MISSING")).toBe(false);
  });
});
