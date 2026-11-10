import type { PublicContentRecord } from "@/lib/public-content-records.functions";

export interface WorkflowStepConfig {
  id: number;
  label: string;
  icon: string;
}

export interface WorkflowPanelItem {
  label: string;
  value: string;
  tone?: "success" | "warning" | "primary" | "muted";
}

export interface WorkflowPanelConfig {
  step: number;
  type: "inbox" | "list" | "classification" | "fields" | "table" | "alert" | "review" | "message" | "timeline";
  title: string;
  subject?: string;
  time?: string;
  body?: string;
  attachments?: string[];
  items?: WorkflowPanelItem[];
  rows?: WorkflowPanelItem[];
  columns?: string[];
  tableRows?: { cells: string[]; status?: string; ok?: boolean }[];
  heading?: string;
  evidence?: string[];
  actions?: string[];
  note?: string;
  status?: string;
}

export interface WorkflowDemoConfig {
  id: string;
  title: string;
  steps: WorkflowStepConfig[];
  exceptionSteps: number[];
  exceptionEntryLabel: string;
  exceptionEntryHint: string;
  standardPanels: WorkflowPanelConfig[];
  exceptionPanels: WorkflowPanelConfig[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseJson(value: unknown): unknown {
  if (isRecord(value)) return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function parsePanel(value: unknown): WorkflowPanelConfig | null {
  if (!isRecord(value)) return null;
  const step = Number(value["step"]);
  const type = value["type"];
  const title = value["title"];
  const validTypes = ["inbox", "list", "classification", "fields", "table", "alert", "review", "message", "timeline"];
  if (!Number.isInteger(step) || step < 1 || typeof title !== "string" || typeof type !== "string" || !validTypes.includes(type)) {
    return null;
  }
  return value as unknown as WorkflowPanelConfig;
}

export function parseWorkflowDemoRecord(record: PublicContentRecord): WorkflowDemoConfig | null {
  const raw = parseJson(record.fields["workflowConfig"]);
  if (!isRecord(raw)) return null;
  const steps = Array.isArray(raw["steps"])
    ? raw["steps"].filter((step): step is WorkflowStepConfig =>
        isRecord(step) && Number.isInteger(step["id"]) && typeof step["label"] === "string" && typeof step["icon"] === "string",
      )
    : [];
  const standardPanels = Array.isArray(raw["standardPanels"])
    ? raw["standardPanels"].map(parsePanel).filter((panel): panel is WorkflowPanelConfig => panel !== null)
    : [];
  const exceptionPanels = Array.isArray(raw["exceptionPanels"])
    ? raw["exceptionPanels"].map(parsePanel).filter((panel): panel is WorkflowPanelConfig => panel !== null)
    : [];
  const exceptionSteps = Array.isArray(raw["exceptionSteps"])
    ? raw["exceptionSteps"].filter((step): step is number => Number.isInteger(step))
    : [];
  if (
    !steps.length ||
    standardPanels.length === 0 ||
    typeof raw["exceptionEntryLabel"] !== "string" ||
    typeof raw["exceptionEntryHint"] !== "string"
  ) {
    return null;
  }
  return {
    id: record.slug,
    title: record.title,
    steps,
    exceptionSteps,
    exceptionEntryLabel: raw["exceptionEntryLabel"],
    exceptionEntryHint: raw["exceptionEntryHint"],
    standardPanels,
    exceptionPanels,
  };
}
