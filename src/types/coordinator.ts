export interface CoordinatorRequest {
  input: string;
}

export interface CoordinatorResponse {
  success: boolean;
  results: AgentResult[];
  error?: string;
  message?: string;
}

export interface AgentResult {
  agent: "email" | "tasks";
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ParsedIntent {
  agents: AgentAction[];
}

export type AgentAction = EmailAction | TaskAction;

export interface EmailAction {
  type: "email";
  params: {
    to: string;
    subject: string;
    body: string;
  };
}

export interface TaskAction {
  type: "tasks";
  params: {
    action: "create" | "list" | "complete" | "delete";
    title?: string;
    notes?: string;
    due?: string;
    taskId?: string;
  };
}
