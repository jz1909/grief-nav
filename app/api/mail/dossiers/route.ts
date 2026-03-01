import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAllDossiers, getDossiersForClassification } from "@/lib/dossier";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forClassification = searchParams.get("forClassification") === "true";
  const batchSize = parseInt(searchParams.get("batchSize") || "25");

  if (forClassification) {
    const result = await getDossiersForClassification(
      session.user.id,
      batchSize
    );
    return NextResponse.json(result);
  }

  const result = await buildAllDossiers(session.user.id);
  return NextResponse.json(result);
}
