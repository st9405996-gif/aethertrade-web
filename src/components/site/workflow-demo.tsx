import { useState, type ComponentType } from "react";
import {
  Inbox,
  Files,
  ScanSearch,
  ListTree,
  Table2,
  GitCompareArrows,
  ClipboardCheck,
  UserCheck,
  TriangleAlert,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Illustrative demonstration of the document review workflow.
 * Static sample content, clearly labelled — not a live product connection.
 */

type FlowKey = "normal" | "exception";

interface Step {
  id: number;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const STEPS: Step[] = [
  { id: 1, label: "Shipment email received", icon: Inbox },
  { id: 2, label: "Documents collected", icon: Files },
  { id: 3, label: "Document types identified", icon: ScanSearch },
  { id: 4, label: "Information extracted", icon: ListTree },
  { id: 5, label: "Shipment data structured", icon: Table2 },
  { id: 6, label: "Documents compared", icon: GitCompareArrows },
  { id: 7, label: "Findings & evidence", icon: ClipboardCheck },
  { id: 8, label: "Human review & workpaper", icon: UserCheck },
];

/** Small window chrome used by every demo panel, styled like a product surface. */
function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-elevated overflow-hidden bg-popover", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
        <span className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-border" />
          <span className="size-2 rounded-full bg-primary/50" />
        </span>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="font-mono text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

const PANELS: Record<FlowKey, Record<number, React.ReactNode>> = {
  normal: {
    1: (
      <Panel title="inbox · shipment@forwarder">
        <div className="rounded-lg border border-border bg-card/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Shipment update — Booking REF-2081</p>
            <span className="font-mono text-[0.65rem] text-muted-foreground">09:41</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Please find attached the document set for the upcoming departure.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Commercial Invoice.pdf", "Packing List.pdf", "Bill of Lading.pdf"].map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[0.7rem]"
              >
                <Files className="size-3 text-primary" /> {f}
              </span>
            ))}
          </div>
        </div>
      </Panel>
    ),
    2: (
      <Panel title="case REF-2081 · document tray">
        <ul className="space-y-2">
          {[
            ["Commercial Invoice.pdf", "Received"],
            ["Packing List.pdf", "Received"],
            ["Bill of Lading.pdf", "Received"],
          ].map(([name, status]) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5"
            >
              <span className="font-mono text-xs">{name}</span>
              <span className="font-mono text-[0.7rem] text-success">{status}</span>
            </li>
          ))}
        </ul>
      </Panel>
    ),
    3: (
      <Panel title="classification · detected types">
        <ul className="space-y-2">
          {[
            ["File A.pdf", "Commercial invoice", "High confidence"],
            ["File B.pdf", "Packing list", "High confidence"],
            ["File C.pdf", "Bill of lading", "High confidence"],
          ].map(([file, type, conf]) => (
            <li
              key={file}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5"
            >
              <span className="font-mono text-xs">{file}</span>
              <span className="flex items-center gap-3">
                <span className="text-xs text-foreground">{type}</span>
                <span className="font-mono text-[0.7rem] text-primary">{conf}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    ),
    4: (
      <Panel title="extraction · available fields">
        <div className="rounded-lg border border-border bg-card/60 px-3">
          <FieldRow label="Shipper" value="Pacific Components Ltd." />
          <FieldRow label="Consignee" value="Meridian Trading GmbH" />
          <FieldRow label="Container" value="MSCU 4821 093-7" />
          <FieldRow label="Gross weight" value="18,420 kg" />
          <FieldRow label="Port of loading" value="Jebel Ali" />
          <FieldRow label="Port of discharge" value="Hamburg" />
          <FieldRow label="Incoterm" value="FOB" />
        </div>
        <p className="mt-3 font-mono text-[0.7rem] text-muted-foreground">
          Sample data for illustration only.
        </p>
      </Panel>
    ),
    5: (
      <Panel title="case REF-2081 · structured shipment">
        <div className="rounded-lg border border-border bg-card/60 px-3">
          <FieldRow label="Case" value="REF-2081" />
          <FieldRow label="Route" value="Jebel Ali → Hamburg" />
          <FieldRow label="Documents linked" value="3 of 3 expected" />
          <FieldRow label="Fields captured" value="34 fields" />
          <FieldRow label="Case status" value="Ready for comparison" />
        </div>
      </Panel>
    ),
    6: (
      <Panel title="comparison · cross-document">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/50 font-mono uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-normal">Field</th>
                <th className="px-3 py-2 font-normal">Invoice</th>
                <th className="px-3 py-2 font-normal">Packing list</th>
                <th className="px-3 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="[&_td]:border-t [&_td]:border-border/60">
              {[
                ["Container", "MSCU 4821 093-7", "MSCU 4821 093-7", "match", true],
                ["Gross weight", "18,420 kg", "18,420 kg", "match", true],
                ["Quantity", "1,200 units", "1,180 units", "mismatch", false],
                ["Origin", "Jebel Ali", "Jebel Ali", "match", true],
              ].map(([f, a, b, status, ok]) => (
                <tr key={f as string} className={ok ? "" : "bg-warning/5"}>
                  <td className="px-3 py-2 font-mono">{f}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a}</td>
                  <td className="px-3 py-2 text-muted-foreground">{b}</td>
                  <td className={cn("px-3 py-2 font-mono", ok ? "text-success" : "text-warning")}>
                    {ok ? "MATCH" : "MISMATCH"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    ),
    7: (
      <Panel title="findings · evidence-backed">
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium">
                Quantity mismatch between commercial invoice and packing list
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Invoice states 1,200 units; packing list states 1,180 units. Human review required
                before any action is taken.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[0.7rem]">
              Evidence · invoice p.1
            </span>
            <span className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[0.7rem]">
              Evidence · packing list p.1
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Findings are presented with references so reviewers can verify every conclusion. A
          discrepancy is a review finding, not an automatic decision.
        </p>
      </Panel>
    ),
    8: (
      <Panel title="review · workpaper REF-2081">
        <ul className="space-y-2">
          {[
            ["Field comparison completed", "3 matched · 1 flagged"],
            ["Finding raised", "Quantity mismatch — evidence attached"],
            ["Reviewer decision", "Pending"],
          ].map(([label, value]) => (
            <li
              key={label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5"
            >
              <span className="text-xs">{label}</span>
              <span className="font-mono text-[0.7rem] text-muted-foreground">{value}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-md border border-success/30 bg-success/10 px-2.5 py-1 font-mono text-[0.7rem] text-success">
            CONFIRM
          </span>
          <span className="rounded-md border border-border px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground">
            ADJUST
          </span>
          <span className="rounded-md border border-border px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground">
            REQUEST DOCUMENTS
          </span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Authorized staff make the consequential decision; the system organizes the evidence.
        </p>
      </Panel>
    ),
  },
  exception: {
    2: (
      <Panel title="case REF-2081 · document tray">
        <ul className="space-y-2">
          {[
            ["Commercial Invoice.pdf", "Received", "text-success"],
            ["Packing List.pdf", "Not received", "text-warning"],
            ["Bill of Lading.pdf", "Received", "text-success"],
          ].map(([name, status, tone]) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/60 px-3 py-2.5"
            >
              <span className="font-mono text-xs">{name}</span>
              <span className={cn("font-mono text-[0.7rem]", tone)}>{status}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-[0.7rem] text-warning">
          EXCEPTION · Expected document missing from the set.
        </p>
      </Panel>
    ),
    5: (
      <Panel title="case REF-2081 · structured shipment">
        <div className="rounded-lg border border-border bg-card/60 px-3">
          <FieldRow label="Case" value="REF-2081" />
          <FieldRow label="Route" value="Jebel Ali → Hamburg" />
          <FieldRow label="Documents linked" value="2 of 3 expected" />
          <FieldRow label="Case status" value="On hold — clarification requested" />
        </div>
      </Panel>
    ),
    6: (
      <Panel title="exception · comparison unavailable">
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-start gap-2.5">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <p className="text-sm font-medium">
                Cross-document comparison paused — packing list not received
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                The case is held rather than reviewed against incomplete information.
              </p>
            </div>
          </div>
        </div>
      </Panel>
    ),
    7: (
      <Panel title="findings · clarification requested">
        <div className="rounded-lg border border-border bg-card/60 p-4">
          <p className="text-sm font-medium">Follow-up prepared for approval</p>
          <p className="mt-1 text-xs text-muted-foreground">
            “Could you share the packing list for booking REF-2081? The document set appears
            incomplete.”
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Messages are prepared for your team to review and send — nothing is sent automatically
            without approval.
          </p>
        </div>
      </Panel>
    ),
  },
};

export function WorkflowDemo() {
  const [flow, setFlow] = useState<FlowKey>("normal");
  const [active, setActive] = useState(1);

  const panel =
    PANELS[flow][active] ?? (flow === "exception" ? PANELS.exception[7] : PANELS.normal[active]);

  const stepsForFlow = STEPS.filter((s) => {
    if (flow === "normal") return true;
    return [2, 5, 6, 7, 8].includes(s.id);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Workflow scenario"
          className="inline-flex rounded-lg border border-border bg-card p-1"
        >
          {(
            [
              ["normal", "Standard flow"],
              ["exception", "Exception flow"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={flow === key}
              onClick={() => {
                setFlow(key);
                setActive(key === "exception" ? 2 : 1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer",
                flow === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground">
          Illustrative demonstration
        </p>
      </div>

      <div className="grid gap-5">
        {/* Node list */}
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Workflow steps">
          {stepsForFlow.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === active;
            const isDone = step.id < active;
            return (
              <li key={step.id} className="relative z-10">
                <button
                  onClick={() => setActive(step.id)}
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors cursor-pointer",
                    isActive
                      ? "border-primary/50 bg-primary/10"
                      : "border-transparent hover:bg-accent/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isDone
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {isDone ? <span aria-hidden>✓</span> : step.id}
                  </span>
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              </li>
            );
          })}
          {flow === "normal" && (
            <li className="relative z-10 mt-2">
              <button
                onClick={() => {
                  setFlow("exception");
                  setActive(2);
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-warning/40 px-3 py-3 text-left transition-colors hover:bg-warning/5 cursor-pointer"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning/10 text-warning">
                  <TriangleAlert className="size-4" />
                </span>
                <span className="text-sm text-muted-foreground">
                  Missing or conflicting information?
                  <span className="block font-mono text-[0.7rem] uppercase tracking-wider text-warning">
                    See the exception branch
                  </span>
                </span>
              </button>
            </li>
          )}
        </ol>

        {/* Detail panel */}
        <div>
          {panel}
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Step {active} of {STEPS.length} · sample data for illustration
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const ids = stepsForFlow.map((s) => s.id);
                const idx = ids.indexOf(active);
                const next = idx >= 0 && idx < ids.length - 1 ? ids[idx + 1] : ids[0];
                if (typeof next === "number") setActive(next);
              }}
            >
              Next step <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
