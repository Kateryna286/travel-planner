/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/guides/route";
import { DELETE } from "@/app/api/guides/[id]/route";
import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({ guides: {} }));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
}));

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const mockAuth = auth as jest.Mock;
const mockSelect = db.select as jest.Mock;
const mockInsert = db.insert as jest.Mock;
const mockDelete = db.delete as jest.Mock;

const SESSION = { user: { id: "user-uuid-123" } };

const DB_GUIDE = {
  id: "PARIS_200326_AB12CD",
  userId: "user-uuid-123",
  destination: "Paris",
  departureDate: "2099-12-01",
  returnDate: "2099-12-10",
  groupType: "Solo",
  groupSize: { adults: 1, children: 0 },
  report: { safety: { level: "GREEN" } },
  formData: {},
  createdAt: new Date("2026-03-23"),
};

const GUIDE_BODY = {
  id: "PARIS_200326_AB12CD",
  destination: "Paris",
  departureDate: "2099-12-01",
  returnDate: "2099-12-10",
  groupType: "Solo",
  groupSize: { adults: 1, children: 0 },
  report: { safety: { level: "GREEN" } },
  formData: {},
  createdAt: "2026-03-23T00:00:00.000Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue(SESSION);
});

describe("GET /api/guides", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns guides list for authenticated user", async () => {
    mockSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockResolvedValue([DB_GUIDE]),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.guides).toHaveLength(1);
    expect(json.guides[0].destination).toBe("Paris");
    expect(json.guides[0].createdAt).toBe("2026-03-23T00:00:00.000Z");
  });
});

describe("POST /api/guides", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/guides", {
      method: "POST",
      body: JSON.stringify(GUIDE_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("saves guide and returns 200", async () => {
    mockInsert.mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing: jest.fn().mockResolvedValue(undefined),
      }),
    });
    const req = new NextRequest("http://localhost/api/guides", {
      method: "POST",
      body: JSON.stringify(GUIDE_BODY),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});

describe("DELETE /api/guides/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/guides/PARIS_200326_AB12CD");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "PARIS_200326_AB12CD" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 404 when guide not found or belongs to another user", async () => {
    mockDelete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    });
    const req = new NextRequest("http://localhost/api/guides/NONEXISTENT");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "NONEXISTENT" }),
    });
    expect(res.status).toBe(404);
  });

  it("deletes guide and returns 200", async () => {
    mockDelete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: "PARIS_200326_AB12CD" }]),
      }),
    });
    const req = new NextRequest("http://localhost/api/guides/PARIS_200326_AB12CD");
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "PARIS_200326_AB12CD" }),
    });
    expect(res.status).toBe(200);
  });
});
