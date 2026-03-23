/**
 * @jest-environment node
 */
import { POST } from "@/app/api/travel/route";
import { NextRequest } from "next/server";

// Mock the Anthropic SDK — never make real API calls in tests
jest.mock("@/lib/anthropic", () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
}));

import { anthropic } from "@/lib/anthropic";
const mockCreate = anthropic.messages.create as jest.Mock;

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
import { auth } from "@/lib/auth";
const mockAuth = auth as jest.Mock;

// Minimal valid request body
const VALID_BODY = {
  destination: "Paris",
  departureDate: "2099-12-01",
  returnDate: "2099-12-10",
  accommodation: { booked: false },
  group: { adults: 1, children: 0, type: "Solo" },
  preferences: ["Food"],
  transportMode: "publicTransport",
};

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/travel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// A minimal valid response for Call A (experiences)
const EXPERIENCES_RESPONSE = {
  content: [{
    type: "text",
    text: JSON.stringify({
      valid: true,
      safety: { level: "GREEN", headline: "Safe", summary: "Safe city", specificRisks: [] },
      attractions: [],
      cuisine: {
        mustTryDishes: [],
        restaurantCategories: [],
        dietaryConsiderations: {
          vegetarianFriendly: true, veganOptions: true,
          halalAvailable: false, kosherAvailable: false,
          commonAllergens: [], notes: "",
        },
        diningCustoms: [],
        tippingGuidance: "",
      },
    }),
  }],
  usage: { input_tokens: 100, output_tokens: 200 },
};

// A minimal valid response for Call B (practicalities)
const PRACTICALITIES_RESPONSE = {
  content: [{
    type: "text",
    text: JSON.stringify({
      valid: true,
      practical: {
        currency: { name: "Euro", code: "EUR", exchangeTip: "", cashVsCard: "" },
        transportation: {
          drivingSide: "right", internationalLicenseRequired: false,
          publicTransportSummary: "", taxiRideshareApps: [], transportTips: [],
        },
        electrical: { voltage: "230V", plugTypes: ["E"], adapterNeeded: true },
        language: { official: ["French"], englishWidelySpoken: true, usefulPhrases: [] },
        weather: { currentSeason: "Spring", expectedConditions: "", packingTips: [], bestSeasons: "" },
        emergency: { policeNumber: "17", ambulanceNumber: "15", embassyTip: "" },
        visa: { requiredForCommonPassports: "No visa required", processingNote: "" },
        culturalCustoms: [],
      },
      destinationFacts: ["Fact 1", "Fact 2", "Fact 3", "Fact 4", "Fact 5"],
    }),
  }],
  usage: { input_tokens: 80, output_tokens: 150 },
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-123" } }); // authenticated by default
  mockCreate
    .mockResolvedValueOnce(EXPERIENCES_RESPONSE)
    .mockResolvedValueOnce(PRACTICALITIES_RESPONSE);
});

describe("POST /api/travel", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/api/travel", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ destination: "Paris" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
  });

  it("returns 422 when Call A returns valid=false", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify({ valid: false, reason: "Not a place" }) }],
        usage: { input_tokens: 50, output_tokens: 10 },
      })
      .mockResolvedValueOnce(PRACTICALITIES_RESPONSE);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("INVALID_DESTINATION");
  });

  it("returns 422 when Call B returns valid=false", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce(EXPERIENCES_RESPONSE)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: JSON.stringify({ valid: false, reason: "Not a place" }) }],
        usage: { input_tokens: 50, output_tokens: 10 },
      });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("INVALID_DESTINATION");
  });

  it("returns 200 with merged TravelReport on success", async () => {
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.report.safety.level).toBe("GREEN");
    expect(json.report.practical.currency.code).toBe("EUR");
    expect(json.report.destinationFacts).toHaveLength(5);
  });

  it("calls Anthropic exactly twice (two parallel calls)", async () => {
    await POST(makeRequest(VALID_BODY));
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe("UNAUTHORIZED");
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
