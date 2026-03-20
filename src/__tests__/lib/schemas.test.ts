import { TravelFormSchema } from "@/lib/schemas";

// Use a fixed future date so tests don't break over time
const FUTURE = "2099-12-01";
const LATER  = "2099-12-10";

const VALID_BASE = {
  destination: "Paris",
  departureDate: FUTURE,
  returnDate: LATER,
  accommodation: { booked: false },
  group: { adults: 1, children: 0, type: "Solo" as const },
  preferences: ["Food" as const],
  transportMode: "publicTransport" as const,
};

describe("TravelFormSchema", () => {
  describe("destination", () => {
    it("rejects empty string", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, destination: "" });
      expect(result.success).toBe(false);
    });

    it("rejects single character", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, destination: "A" });
      expect(result.success).toBe(false);
    });

    it("accepts 2+ characters", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, destination: "UK" });
      expect(result.success).toBe(true);
    });
  });

  describe("dates", () => {
    it("rejects returnDate on same day as departureDate", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        departureDate: FUTURE,
        returnDate: FUTURE,
      });
      expect(result.success).toBe(false);
    });

    it("rejects returnDate before departureDate", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        departureDate: LATER,
        returnDate: FUTURE,
      });
      expect(result.success).toBe(false);
    });

    it("accepts returnDate after departureDate", () => {
      const result = TravelFormSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });
  });

  describe("accommodation", () => {
    it("requires address when booked=true", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        accommodation: { booked: true },
      });
      expect(result.success).toBe(false);
    });

    it("requires address to be at least 5 chars when booked=true", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        accommodation: { booked: true, address: "Ab" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts booked=true with valid address", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        accommodation: { booked: true, address: "12 Rue de Rivoli, Paris" },
      });
      expect(result.success).toBe(true);
    });

    it("accepts booked=false with no address", () => {
      const result = TravelFormSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });
  });

  describe("group", () => {
    it("rejects Friends group with only 1 adult", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        group: { adults: 1, children: 0, type: "Friends" },
      });
      expect(result.success).toBe(false);
    });

    it("accepts Friends group with 2+ adults", () => {
      const result = TravelFormSchema.safeParse({
        ...VALID_BASE,
        group: { adults: 2, children: 0, type: "Friends" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("preferences", () => {
    it("rejects empty preferences array", () => {
      const result = TravelFormSchema.safeParse({ ...VALID_BASE, preferences: [] });
      expect(result.success).toBe(false);
    });

    it("accepts at least one preference", () => {
      const result = TravelFormSchema.safeParse(VALID_BASE);
      expect(result.success).toBe(true);
    });
  });
});
