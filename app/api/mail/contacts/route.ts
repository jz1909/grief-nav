import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContacts } from "@/lib/gmail";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await getContacts(session.user.id);

  return NextResponse.json({ contacts });
}
