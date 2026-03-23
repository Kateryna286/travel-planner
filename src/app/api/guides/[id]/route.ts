import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guides } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const deleted = await db
    .delete(guides)
    .where(and(eq(guides.id, id), eq(guides.userId, session.user.id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json(
      { success: false, error: "Not found", code: "NOT_FOUND" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
