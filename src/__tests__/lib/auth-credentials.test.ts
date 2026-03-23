/**
 * @jest-environment node
 */
import { authorizeCredentials } from "@/lib/auth-credentials";

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));
jest.mock("bcryptjs");

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const mockSelect = db.select as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;

function mockDbUser(user: {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
} | null) {
  mockSelect.mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(user ? [user] : []),
      }),
    }),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("authorizeCredentials", () => {
  it("returns null when user is not found", async () => {
    mockDbUser(null);
    const result = await authorizeCredentials("unknown@example.com", "password");
    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when user has no passwordHash (OAuth-only account)", async () => {
    mockDbUser({ id: "1", email: "user@example.com", name: "Alice", passwordHash: null });
    const result = await authorizeCredentials("user@example.com", "password");
    expect(result).toBeNull();
    expect(mockCompare).not.toHaveBeenCalled();
  });

  it("returns null when password does not match", async () => {
    mockDbUser({ id: "1", email: "user@example.com", name: "Alice", passwordHash: "$2b$12$hashed" });
    mockCompare.mockResolvedValue(false);
    const result = await authorizeCredentials("user@example.com", "wrongpassword");
    expect(result).toBeNull();
    expect(mockCompare).toHaveBeenCalledWith("wrongpassword", "$2b$12$hashed");
  });

  it("returns user object when credentials are valid", async () => {
    mockDbUser({ id: "abc-123", email: "user@example.com", name: "Alice", passwordHash: "$2b$12$hashed" });
    mockCompare.mockResolvedValue(true);
    const result = await authorizeCredentials("user@example.com", "correct");
    expect(result).toEqual({ id: "abc-123", email: "user@example.com", name: "Alice" });
  });
});
