import { NextRequest, NextResponse } from "next/server";
import { auth, getGoogleAccessToken } from "@/lib/auth";
import { buildAllDossiers } from "@/lib/dossier";
import {
  composeNotificationEmails,
  saveNotificationDrafts,
  getNotificationDrafts,
  updateDraftStatus,
  sendApprovedNotifications,
} from "@/lib/agents/notification-composer";

// POST - Generate notification drafts
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { deceasedName, senderName } = body;

    if (!deceasedName || !senderName) {
      return NextResponse.json(
        { error: "deceasedName and senderName are required" },
        { status: 400 }
      );
    }

    // Build dossiers for context
    const { dossiers } = await buildAllDossiers(session.user.id);

    // Check if we have classified contacts
    const { prisma } = await import("@/lib/prisma");
    const classifiedCount = await prisma.contact.count({
      where: { userId: session.user.id, group: { not: null } },
    });

    if (classifiedCount === 0) {
      return NextResponse.json(
        {
          error: "No classified contacts found. Please classify your contacts first (Step 4).",
          success: false,
          draftsGenerated: 0,
        },
        { status: 400 }
      );
    }

    // Compose notifications
    const result = await composeNotificationEmails(
      session.user.id,
      deceasedName,
      senderName,
      dossiers
    );

    // Save drafts to database
    const saved = await saveNotificationDrafts(session.user.id, result.drafts);

    return NextResponse.json({
      success: result.errors.length === 0 && result.drafts.length > 0,
      draftsGenerated: result.drafts.length,
      draftsSaved: saved,
      byGroup: Object.fromEntries(
        Object.entries(result.byGroup).map(([group, drafts]) => [
          group,
          drafts.length,
        ])
      ),
      errors: result.errors,
    });
  } catch (error) {
    console.error("Notification generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate notifications",
        success: false,
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve notification drafts
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await getNotificationDrafts(session.user.id);

  // Group by status and category
  const byStatus = {
    draft: drafts.filter((d) => d.status === "draft"),
    approved: drafts.filter((d) => d.status === "approved"),
    sent: drafts.filter((d) => d.status === "sent"),
    skipped: drafts.filter((d) => d.status === "skipped"),
  };

  const byGroup: Record<string, typeof drafts> = {};
  for (const draft of drafts) {
    if (!byGroup[draft.group]) {
      byGroup[draft.group] = [];
    }
    byGroup[draft.group].push(draft);
  }

  return NextResponse.json({
    total: drafts.length,
    drafts,
    byStatus: {
      draft: byStatus.draft.length,
      approved: byStatus.approved.length,
      sent: byStatus.sent.length,
      skipped: byStatus.skipped.length,
    },
    byGroup: Object.fromEntries(
      Object.entries(byGroup).map(([group, items]) => [group, items.length])
    ),
  });
}

// PATCH - Update draft status (approve, skip, edit)
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { draftId, status, subject, body: emailBody } = body;

  if (!draftId) {
    return NextResponse.json({ error: "draftId is required" }, { status: 400 });
  }

  // If updating content
  if (subject || emailBody) {
    const { prisma } = await import("@/lib/prisma");
    await prisma.notificationDraft.update({
      where: { id: draftId, userId: session.user.id },
      data: {
        ...(subject && { subject }),
        ...(emailBody && { body: emailBody }),
        updatedAt: new Date(),
      },
    });
  }

  // If updating status
  if (status) {
    const validStatuses = ["draft", "approved", "sent", "skipped"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await updateDraftStatus(draftId, session.user.id, status);
  }

  return NextResponse.json({ success: true });
}

// PUT - Send all approved notifications
export async function PUT() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getGoogleAccessToken(session.user.id);

  if (!accessToken) {
    return NextResponse.json(
      { error: "No Google account linked" },
      { status: 400 }
    );
  }

  const result = await sendApprovedNotifications(session.user.id, accessToken);

  return NextResponse.json({
    success: result.errors.length === 0,
    sent: result.sent,
    errors: result.errors,
  });
}
