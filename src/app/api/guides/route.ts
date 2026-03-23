import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guides } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import type { SavedGuide } from "@/lib/guides-storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const rows = await db
    .select()
    .from(guides)
    .where(eq(guides.userId, session.user.id))
    .orderBy(desc(guides.createdAt));

  const result: SavedGuide[] = rows.map((row) => ({
    id: row.id,
    destination: row.destination,
    departureDate: row.departureDate,
    returnDate: row.returnDate,
    groupType: row.groupType,
    groupSize: row.groupSize as SavedGuide["groupSize"],
    report: row.report as SavedGuide["report"],
    formData: row.formData as SavedGuide["formData"],
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return NextResponse.json({ success: true, guides: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const guide = (await req.json()) as SavedGuide;

  await db
    .insert(guides)
    .values({
      id: guide.id,
      userId: session.user.id,
      destination: guide.destination,
      departureDate: guide.departureDate,
      returnDate: guide.returnDate,
      groupType: guide.groupType,
      groupSize: guide.groupSize,
      report: guide.report,
      formData: guide.formData,
    })
    .onConflictDoNothing();

  return NextResponse.json({ success: true });
}
