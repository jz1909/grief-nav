import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDossiersForClassification } from "@/lib/dossier";
import {
  classifyAllContacts,
  getClassificationStatus,
  overrideContactClassification,
  resetClassifications,
  DEFAULT_CATEGORIES,
} from "@/lib/classifier";
import {
  composeNotificationEmails,
  saveNotificationDrafts,
} from "@/lib/agents/notification-composer";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const categories = body.categories || DEFAULT_CATEGORIES;
  const batchSize = body.batchSize || 25;
  const generateNotifications = body.generateNotifications || false;
  const deceasedName = body.deceasedName;
  const senderName = body.senderName;

  // Get dossiers
  const { batches, totalContacts } = await getDossiersForClassification(
    session.user.id,
    batchSize
  );

  // Flatten batches for classification
  const allDossiers = batches.flat();

  // Classify
  const result = await classifyAllContacts(
    session.user.id,
    allDossiers,
    categories,
    batchSize
  );

  // Optionally generate notification drafts at end of workflow
  let notificationResult = null;
  if (generateNotifications && deceasedName && senderName) {
    const notifications = await composeNotificationEmails(
      session.user.id,
      deceasedName,
      senderName,
      allDossiers
    );
    const saved = await saveNotificationDrafts(
      session.user.id,
      notifications.drafts
    );
    notificationResult = {
      draftsGenerated: notifications.drafts.length,
      draftsSaved: saved,
      byGroup: Object.fromEntries(
        Object.entries(notifications.byGroup).map(([group, drafts]) => [
          group,
          drafts.length,
        ])
      ),
      errors: notifications.errors,
    };
  }

  return NextResponse.json({
    success: result.errors.length === 0,
    classified: result.results.length,
    updated: result.updated,
    errors: result.errors,
    notifications: notificationResult,
  });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getClassificationStatus(session.user.id);
  return NextResponse.json(status);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contactId, group, rationale } = body;

  if (!contactId || !group) {
    return NextResponse.json(
      { error: "contactId and group required" },
      { status: 400 }
    );
  }

  const updated = await overrideContactClassification(
    contactId,
    session.user.id,
    group,
    rationale
  );

  return NextResponse.json({ success: true, contact: updated });
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await resetClassifications(session.user.id);
  return NextResponse.json({ success: true, reset: count });
}
