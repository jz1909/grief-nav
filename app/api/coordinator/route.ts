import { NextRequest, NextResponse } from "next/server";
import { auth, getGoogleAccessToken } from "@/lib/auth";
import { parseUserIntent } from "@/lib/anthropic";
import { sendEmail } from "@/lib/agents/email";
import { handleTasks } from "@/lib/agents/tasks";
import type {
  CoordinatorRequest,
  CoordinatorResponse,
  AgentResult,
} from "@/types/coordinator";

export async function POST(request: NextRequest): Promise<NextResponse<CoordinatorResponse>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, results: [], error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body: CoordinatorRequest = await request.json();

  if (!body.input?.trim()) {
    return NextResponse.json(
      { success: false, results: [], error: "No input provided" },
      { status: 400 }
    );
  }

  // Get access token for Google APIs
  const accessToken = await getGoogleAccessToken(session.user.id);

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        results: [],
        error: "No Google account linked",
      },
      { status: 400 }
    );
  }

  // Parse user intent
  const intent = await parseUserIntent(body.input);

  if (intent.agents.length === 0) {
    return NextResponse.json({
      success: true,
      results: [],
      message: "No actionable intent detected",
    });
  }

  // Execute agents
  const results: AgentResult[] = [];

  for (const agent of intent.agents) {
    let result: AgentResult;

    switch (agent.type) {
      case "email":
        result = await sendEmail(accessToken, agent.params);
        break;
      case "tasks":
        result = await handleTasks(accessToken, agent.params);
        break;
      default:
        result = {
          agent: "email",
          success: false,
          message: `Unknown agent type`,
        };
    }

    results.push(result);
  }

  return NextResponse.json({
    success: results.every((r) => r.success),
    results,
  });
}
