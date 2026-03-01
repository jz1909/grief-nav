// ── Types ────────────────────────────────────────────────────────────────────

export type StepStatus = "completed" | "in_progress" | "pending";

export interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: StepStatus;
}

export interface GroupBreakdown {
  label: string;
  count: number;
}

export interface DashboardStats {
  emailsImported: number;
  contactsFound: number;
  contactsClassified: number;
  groups: GroupBreakdown[];
}

export interface DashboardData {
  pipeline: PipelineStep[];
  stats: DashboardStats;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "import",
    label: "Import Emails",
    description: "Fetch the last 90 days of Gmail messages",
    status: "completed",
  },
  {
    id: "extract",
    label: "Extract Contacts",
    description: "Normalize unique email addresses",
    status: "completed",
  },
  {
    id: "dossiers",
    label: "Build Dossiers",
    description: "Analyze patterns, keywords, and signatures",
    status: "in_progress",
  },
  {
    id: "classify",
    label: "Classify Contacts",
    description: "AI categorizes with confidence scores",
    status: "pending",
  },
  {
    id: "review",
    label: "Review & Override",
    description: "Drag-and-drop reassignment of categories",
    status: "pending",
  },
  {
    id: "send",
    label: "Draft & Send",
    description: "Generate and approve notification emails",
    status: "pending",
  },
];

export const MOCK_STATS: DashboardStats = {
  emailsImported: 4218,
  contactsFound: 312,
  contactsClassified: 0,
  groups: [
    { label: "Immediate Family", count: 0 },
    { label: "Extended Family", count: 0 },
    { label: "Professional", count: 0 },
    { label: "Unclassified", count: 312 },
  ],
};

export const MOCK_DASHBOARD_DATA: DashboardData = {
  pipeline: MOCK_PIPELINE_STEPS,
  stats: MOCK_STATS,
};
