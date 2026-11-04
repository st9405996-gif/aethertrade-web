import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/admin/workspace-provider";
export default function AuthPage() {
  const { signIn, sendPasswordRecovery, authenticated } = useWorkspace();
  const navigate = useNavigate();
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [recovery,setRecovery]=useState(false); const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState(""); const [error,setError]=useState("");
  async function submit(e:FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if(recovery) { await sendPasswordRecovery(email); setMessage("If this administrator account exists, a recovery email has been sent."); }
      else { await signIn(email,password); await navigate({to:"/admin",replace:true}); }
    } catch(x) { setError(x instanceof Error?x.message:"Authentication failed."); }
    finally { setBusy(false); }
  }
  if(authenticated) void navigate({to:"/admin",replace:true});
  return <div className="container-page mx-auto max-w-lg py-16">
    <LockKeyhole className="mb-6 size-8 text-primary"/><p className="eyebrow">Administrator access</p>
    <h1 className="mt-3 text-3xl font-semibold">{recovery?"Recover your account":"Sign in to AETHER-TRADE"}</h1>
    <p className="mt-4 text-sm text-muted-foreground">Authorized administrators only.</p>
    <form className="mt-8 space-y-5" onSubmit={submit}>
      <label className="grid gap-2 text-sm">Email<Input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      {!recovery&&<label className="grid gap-2 text-sm">Password<Input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>}
      {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
      {message&&<p role="status" className="text-sm text-success">{message}</p>}
      <Button className="w-full" type="submit" disabled={busy}><LockKeyhole/>{busy?"Please wait…":recovery?"Send recovery email":"Sign in"}</Button>
    </form>
    <Button variant="link" className="mt-3 px-0" onClick={()=>{setRecovery(!recovery);setMessage("");setError("");}}>{recovery?"Back to sign-in":"Forgot password?"}</Button>
    <div className="mt-8 border-t border-border pt-6"><Button asChild variant="outline" className="w-full"><Link to="/"><ArrowRight/>Return to website</Link></Button></div>
  </div>;
}
