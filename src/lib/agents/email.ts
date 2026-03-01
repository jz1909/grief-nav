import { google } from "googleapis";
import type { AgentResult } from "@/types/coordinator";

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(
  accessToken: string,
  params: EmailParams
): Promise<AgentResult> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Create email in RFC 2822 format
    const email = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      params.body,
    ].join("\n");

    // Encode to base64url
    const encodedMessage = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      agent: "email",
      success: true,
      message: `Email sent to ${params.to}`,
    };
  } catch (error) {
    return {
      agent: "email",
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
