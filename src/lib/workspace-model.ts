import { z } from "zod";
import type { GlobalSeoSettings } from "@/lib/global-seo.model";
import {
  PLATFORM_MODULES,
  SERVICES,
  SOLUTIONS,
  INDUSTRIES,
  FAQS,
  INSIGHTS,
  PARTNERSHIP_TYPES,
} from "@/content/site-content";
import { CATALOGUE_PREVIEW } from "@/lib/catalogue-preview";

export const availabilityValues = [
  "Available",
  "In Development",
  "Custom Build",
  "Planned",
] as const;
export const publicationValues = ["Draft", "Published", "Scheduled", "Archived"] as const;
export const inquiryValues = [
  "New",
  "Contacted",
  "Qualified",
  "In Progress",
  "Closed",
  "Rejected",
] as const;
export const roles = [
  "Super Admin",
  "Administrator",
  "Content Editor",
  "Sales Manager",
  "Viewer",
] as const;
export type Role = (typeof roles)[number];
export type Permission =
  "draft" | "publish" | "inquiries" | "export" | "users" | "settings" | "report";
const rolePermissions: Record<Role, Permission[]> = {
  "Super Admin": ["draft", "publish", "inquiries", "export", "users", "settings", "report"],
  Administrator: ["draft", "publish", "inquiries", "export", "settings", "report"],
  "Content Editor": ["draft"],
  "Sales Manager": ["inquiries", "export", "report"],
  Viewer: ["report"],
};
// UI simulation only. These values must never authorize a connected endpoint.
export function demoCan(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
export const modules = [
  ["overview", "Overview", "Workspace"],
  ["pages", "Pages & sections", "Content"],
  ["platform", "Platform", "Content"],
  ["automations", "Automations", "Content"],
  ["services", "Services", "Content"],
  ["solutions", "Solutions", "Content"],
  ["industries", "Industries", "Content"],
  ["insights", "Insights", "Content"],
  ["faqs", "FAQs", "Content"],
  ["media", "Media library", "Content"],
  ["navigation", "Navigation & footer", "Website"],
  ["seo", "SEO", "Website"],
  ["global-seo", "Global SEO", "Website"],
  ["branding", "Branding & contact", "Website"],
  ["settings", "Website settings", "Website"],
  ["inquiries", "Inquiries", "Operations"],
  ["partnerships", "Partnerships", "Operations"],
  ["careers", "Careers", "Operations"],
  ["subscribers", "Subscribers", "Operations"],
  ["users", "Users & roles", "Governance"],
  ["revisions", "Revisions", "Governance"],
  ["audit", "Audit log", "Governance"],
  ["analytics", "Analytics", "Governance"],
  ["connections", "Connection readiness", "Governance"],
] as const;
export type ModuleId = (typeof modules)[number][0];
export interface ContentRecord {
  id: string;
  module: string;
  title: string;
  slug: string;
  body: string;
  category: string;
  publication: (typeof publicationValues)[number];
  availability: (typeof availabilityValues)[number];
  seoTitle: string;
  seoDescription: string;
  canonical: string;
  noindex: boolean;
  position: number;
  scheduledAt: string;
  updatedAt: string;
  fields: Record<string, string>;
}
export interface Inquiry {
  id: string;
  reference: string;
  kind: "contact" | "demo";
  name: string;
  email: string;
  company: string;
  country: string;
  category: string;
  automation: string;
  message: string;
  requirements: string;
  consent: true;
  status: (typeof inquiryValues)[number];
  createdAt: string;
  notes: { text: string; at: string }[];
  assignedTo: string;
  followUp: string;
}
export interface MediaRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  alt: string;
  url: string;
  bucketId: string;
  objectPath: string;
}
export interface Revision {
  id: string;
  record: ContentRecord;
  at: string;
  action: string;
}
export interface Audit {
  id: string;
  action: string;
  title: string;
  at: string;
  changedFields: string[];
}
export interface AnalyticsEvent {
  id: string;
  eventType: string;
  pagePath: string;
  automationSlug: string;
  consent: true;
  createdAt: string;
}
export interface Subscriber {
  id: string;
  email: string;
  status: "subscribed" | "unsubscribed";
  consent: true;
  consentAt: string;
  source: string;
  createdAt: string;
}
export interface DemoWorkspace {
  records: ContentRecord[];
  inquiries: Inquiry[];
  media: MediaRecord[];
  revisions: Revision[];
  audit: Audit[];
  analytics: AnalyticsEvent[];
  subscribers: Subscriber[];
}

export const contentSchema = z
  .object({
    title: z.string().trim().min(1, "A title is required").max(160),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens"),
    body: z.string().max(30000),
    publication: z.enum(publicationValues),
    availability: z.enum(availabilityValues),
    scheduledAt: z.string(),
  })
  .superRefine((v, ctx) => {
    if (
      v.publication === "Scheduled" &&
      (!v.scheduledAt || !Number.isFinite(Date.parse(v.scheduledAt)))
    )
      ctx.addIssue({
        code: "custom",
        path: ["scheduledAt"],
        message: "Choose a valid publication date",
      });
  });
export const inquirySchema = z
  .object({
    kind: z.enum(["contact", "demo"]),
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().email("Enter a valid business email").max(254),
    company: z.string().trim().min(1, "Enter your company").max(160),
    country: z.string().trim().min(1, "Enter your country").max(100),
    category: z.string().trim().max(100),
    automation: z.string().max(160),
    message: z.string().trim().min(10, "Please enter at least 10 characters").max(4000),
    requirements: z.string().trim().max(4000),
    consent: z.literal(true, { error: "Privacy consent is required" }),
    website: z.string().max(0, "Submission could not be accepted"),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "demo" && v.requirements.length < 10)
      ctx.addIssue({
        code: "custom",
        path: ["requirements"],
        message: "Describe your requirements in at least 10 characters",
      });
  });
export function isPublic(record: ContentRecord, now = Date.now()) {
  return (
    record.publication === "Published" ||
    (record.publication === "Scheduled" && Date.parse(record.scheduledAt) <= now)
  );
}
export function safeCsvCell(value: string) {
  return `"${(/^[\s]*[=+@-]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`;
}
export function serializeCsv(rows: readonly (readonly string[])[]) {
  return rows.map((row) => row.map(safeCsvCell).join(",")).join("\n");
}
export function canExportRows(role: Role, rowCount: number) {
  return rowCount > 0 && demoCan(role, "export");
}
export function filterInquiries(
  inquiries: Inquiry[],
  filters: { search: string; status: string; kind: string },
) {
  const search = filters.search.toLowerCase();
  return inquiries.filter(
    (r) =>
      `${r.name} ${r.company} ${r.reference} ${r.email}`.toLowerCase().includes(search) &&
      (filters.status === "All" || r.status === filters.status) &&
      (filters.kind === "All" || r.kind === filters.kind),
  );
}
export function filterContentRecords(
  records: ContentRecord[],
  filters: { search: string; status: string; category: string },
) {
  const search = filters.search.trim().toLowerCase();
  return records.filter(
    (record) =>
      `${record.title} ${record.body} ${record.category}`.toLowerCase().includes(search) &&
      (filters.status === "All" || record.publication === filters.status) &&
      (filters.category === "All" || record.category === filters.category),
  );
}
export function sortContentRecords(records: readonly ContentRecord[]) {
  return [...records].sort((a, b) => {
    const positionOrder = a.position - b.position;
    if (positionOrder !== 0) return positionOrder;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
export function makeRecord(
  module: string,
  title = "Untitled",
  body = "",
  position = 0,
): ContentRecord {
  return {
    id: `${module}-${position}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    module,
    title,
    slug:
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "untitled",
    body,
    category: "",
    publication: "Draft",
    availability: "Planned",
    seoTitle: "",
    seoDescription: "",
    canonical: "",
    noindex: false,
    position,
    scheduledAt: "",
    updatedAt: "",
    fields: {},
  };
}
export function createDemoWorkspace(): DemoWorkspace {
  const records: ContentRecord[] = [];
  function add(module: string, title: string, body: string, fields: Partial<ContentRecord> = {}) {
    records.push({
      ...makeRecord(module, title, body, records.filter((r) => r.module === module).length),
      publication: "Published",
      ...fields,
    });
  }
  const pages = [
    "Home",
    "About",
    "Platform",
    "How It Works",
    "Solutions",
    "Industries",
    "Services",
    "Automations",
    "Custom Solutions",
    "Insights",
    "Partnerships",
    "Careers",
    "FAQs",
    "Contact",
    "Request Demo",
    "Privacy Policy",
    "Terms",
    "Cookie Policy",
  ];
  pages.forEach((title) =>
    add("pages", title, "", {
      publication: title === "Careers" ? "Draft" : "Published",
      noindex: title === "Careers",
      fields: {
        sections: "[]",
        note:
          title === "Cookie Policy"
            ? "Legal-review draft"
            : "Existing public page; body edits are preview-only in this disconnected workspace.",
      },
    }),
  );
  PLATFORM_MODULES.forEach((r) =>
    add("platform", r.title, r.body, {
      availability: r.status,
      fields: { capabilities: (r.points || []).join("\n") },
    }),
  );
  CATALOGUE_PREVIEW.forEach((r) =>
    add("automations", r.name, r.whatItDoes, {
      slug: r.slug,
      category: r.category,
      availability: r.availability,
      fields: {
        problem: r.problem,
        workflow: r.exampleWorkflow,
        integrations: r.integrations.join("\n"),
        deployment: r.deploymentModel,
      },
    }),
  );
  SERVICES.forEach((r) =>
    add("services", r.title, r.body, {
      availability: r.status,
      fields: { deliverables: r.deliverables.join("\n") },
    }),
  );
  SOLUTIONS.forEach((r) =>
    add("solutions", r.title, r.audience, {
      slug: r.slug,
      fields: { challenges: r.challenges.join("\n"), benefits: r.helps.join("\n") },
    }),
  );
  INDUSTRIES.forEach((r) => add("industries", r.title, r.body));
  FAQS.forEach((r) => add("faqs", r.q, r.a));
  INSIGHTS.forEach((r) =>
    add("insights", r.title, r.excerpt, {
      slug: r.slug,
      category: r.category,
      publication: "Draft",
      fields: { author: "", tags: "" },
    }),
  );
  PARTNERSHIP_TYPES.forEach((r) => add("partnerships", r.title, r.body));
  ["Platform", "Solutions", "Automations", "Services", "Insights", "About"].forEach((title) =>
    add("navigation", title, `/${title.toLowerCase()}`, {
      category: "Header",
      fields: { visible: "true" },
    }),
  );
  ["FAQs", "Industries", "Partnerships", "Privacy Policy", "Cookie Policy", "Terms"].forEach(
    (title) =>
      add("navigation", title, `/${title.toLowerCase().replaceAll(" ", "-")}`, {
        category: "Footer",
        fields: { visible: "true" },
      }),
  );
  add("branding", "Company identity", "AETHER-TRADE", {
    fields: { email: "", phone: "", address: "", social: "", font: "Geist", logo: "" },
  });
  add("settings", "Publication & notifications", "", {
    fields: {
      careersEnabled: "false",
      cookiePolicyApproved: "false",
      notificationRecipients: "",
      analyticsConsent: "false",
    },
  });
  return { records, inquiries: [], media: [], revisions: [], audit: [] };
}
