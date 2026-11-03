import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createDemoWorkspace, type DemoWorkspace, type Role, type ContentRecord, type Inquiry, type MediaRecord } from "@/lib/workspace-model";

const key = "aether-demo-workspace-v1";
type ContextValue = { data: DemoWorkspace; ready: boolean; role: Role; setRole: (r: Role) => void;
  save: (r: ContentRecord) => void; remove: (id: string) => void; restore: (id: string) => void;
  addInquiry: (r: Inquiry) => void; updateInquiry: (r: Inquiry) => void;
  addMedia: (r: MediaRecord) => void; updateMedia: (r: MediaRecord) => void; removeMedia: (id: string) => void; reset: () => void; storageError: string; };
const Context = createContext<ContextValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(createDemoWorkspace);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [role, setRole] = useState<Role>("Super Admin");
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) { const parsed = JSON.parse(raw) as DemoWorkspace; if (Array.isArray(parsed.records) && Array.isArray(parsed.inquiries) && Array.isArray(parsed.media) && Array.isArray(parsed.revisions) && Array.isArray(parsed.audit)) setData(parsed); } }
    catch { setStorageError("Demo storage could not be read. Changes are not connected to a database."); }
    setReady(true);
  }, []);
  function persist(next: DemoWorkspace) {
    // Write first: a failed browser write must never be reported as a saved submission.
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(""); setData(next); }
    catch { setStorageError("Browser storage is full or unavailable. Your change was not saved."); throw new Error("Browser storage is unavailable. Your change was not saved."); }
  }
  function audit(action: string, title: string) { return { id: crypto.randomUUID(), action, title, at: new Date().toISOString() }; }
  return <Context.Provider value={{ data, ready, role, setRole, storageError,
    save: r => { const previous = data.records.find(x => x.id === r.id); persist({ ...data, records: [...data.records.filter(x => x.id !== r.id), { ...r, updatedAt: new Date().toISOString() }], revisions: previous ? [{ id: crypto.randomUUID(), record: previous, at: new Date().toISOString(), action: "Before edit" }, ...data.revisions] : data.revisions, audit: [audit(previous ? "Updated" : "Created", r.title), ...data.audit] }); },
    remove: id => { const r = data.records.find(x => x.id === id); if (!r) return; persist({ ...data, records: data.records.filter(x => x.id !== id), revisions: [{ id: crypto.randomUUID(), record: r, at: new Date().toISOString(), action: "Before delete" }, ...data.revisions], audit: [audit("Deleted", r.title), ...data.audit] }); },
    restore: id => { const revision = data.revisions.find(x => x.id === id); if (!revision) return; const previous = data.records.find(x => x.id === revision.record.id); persist({ ...data, records: [...data.records.filter(x => x.id !== revision.record.id), { ...revision.record, publication: "Draft", updatedAt: new Date().toISOString() }], revisions: previous ? [{ id: crypto.randomUUID(), record: previous, at: new Date().toISOString(), action: "Before restore" }, ...data.revisions] : data.revisions, audit: [audit("Restored as draft", revision.record.title), ...data.audit] }); },
    addInquiry: r => { if (data.inquiries.some(x => x.id === r.id)) return; persist({ ...data, inquiries: [r, ...data.inquiries], audit: [audit("Demo inquiry saved", r.reference), ...data.audit] }); },
    updateInquiry: r => persist({ ...data, inquiries: data.inquiries.map(x => x.id === r.id ? r : x), audit: [audit("Inquiry updated", r.reference), ...data.audit] }),
    addMedia: r => persist({ ...data, media: [r, ...data.media], audit: [audit("Demo media added", r.name), ...data.audit] }),
    updateMedia: r => persist({ ...data, media: data.media.map(x => x.id === r.id ? r : x), audit: [audit("Media metadata updated", r.name), ...data.audit] }),
    removeMedia: id => persist({ ...data, media: data.media.filter(x => x.id !== id), audit: [audit("Demo media removed", id), ...data.audit] }),
    reset: () => persist(createDemoWorkspace()),
  }}>{children}</Context.Provider>;
}
export function useWorkspace() { const context = useContext(Context); if (!context) throw new Error("Workspace provider is missing"); return context; }