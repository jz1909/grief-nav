import { google } from "googleapis";
import type { AgentResult } from "@/types/coordinator";

interface TaskParams {
  action: "create" | "list" | "complete" | "delete";
  title?: string;
  notes?: string;
  due?: string;
  taskId?: string;
}

export async function handleTasks(
  accessToken: string,
  params: TaskParams
): Promise<AgentResult> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const tasks = google.tasks({ version: "v1", auth: oauth2Client });

    // Get default task list
    const taskLists = await tasks.tasklists.list();
    const defaultList = taskLists.data.items?.[0];

    if (!defaultList?.id) {
      return {
        agent: "tasks",
        success: false,
        message: "No task list found",
      };
    }

    switch (params.action) {
      case "create": {
        const result = await tasks.tasks.insert({
          tasklist: defaultList.id,
          requestBody: {
            title: params.title,
            notes: params.notes,
            due: params.due,
          },
        });
        return {
          agent: "tasks",
          success: true,
          message: `Task created: ${params.title}`,
          data: result.data,
        };
      }

      case "list": {
        const result = await tasks.tasks.list({
          tasklist: defaultList.id,
          maxResults: 10,
        });
        return {
          agent: "tasks",
          success: true,
          message: `Found ${result.data.items?.length || 0} tasks`,
          data: result.data.items,
        };
      }

      case "complete": {
        await tasks.tasks.update({
          tasklist: defaultList.id,
          task: params.taskId!,
          requestBody: { status: "completed" },
        });
        return {
          agent: "tasks",
          success: true,
          message: "Task marked as completed",
        };
      }

      case "delete": {
        await tasks.tasks.delete({
          tasklist: defaultList.id,
          task: params.taskId!,
        });
        return {
          agent: "tasks",
          success: true,
          message: "Task deleted",
        };
      }

      default:
        return {
          agent: "tasks",
          success: false,
          message: `Unknown action: ${params.action}`,
        };
    }
  } catch (error) {
    return {
      agent: "tasks",
      success: false,
      message: `Task operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
