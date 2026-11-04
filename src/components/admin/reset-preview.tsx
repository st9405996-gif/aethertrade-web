import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/admin/workspace-provider";
export default function ResetPage() {
 const {updatePassword}=useWorkspace();const navigate=useNavigate();const [password,setPassword]=useState("");const [message,setMessage]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{await updatePassword(password);setMessage("Password updated. You can now sign in.");setTimeout(()=>void navigate({to:"/auth"}),900);}catch(x){setError(x instanceof Error?x.message:"Password update failed.");}finally{setBusy(false);}}
 return <div className="container-page mx-auto max-w-lg py-16"><p className="eyebrow">Account recovery</p><h1 className="mt-4 text-3xl font-semibold">Set a new password</h1><form onSubmit={submit} className="mt-6 space-y-4"><label className="grid gap-2 text-sm">New password<Input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{message&&<p role="status" className="text-sm text-success">{message}</p>}<Button type="submit" disabled={busy}>{busy?"Updating…":"Update password"}</Button></form><Link to="/auth" className="mt-6 inline-block text-sm text-primary">Back to administrator access</Link></div>;
}
