import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importGmailMessages, getImportStats } from "@/lib/gmail";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await importGmailMessages(session.user.id);

  return NextResponse.json({
    success: !result.error,
    messagesImported: result.messagesImported,
    contactsCreated: result.contactsCreated,
    error: result.error,
  });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getImportStats(session.user.id);

  return NextResponse.json(stats);
}
