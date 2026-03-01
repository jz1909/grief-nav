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

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const categories = body.categories || DEFAULT_CATEGORIES;
  const batchSize = body.batchSize || 25;

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

  return NextResponse.json({
    success: result.errors.length === 0,
    classified: result.results.length,
    updated: result.updated,
    errors: result.errors,
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
