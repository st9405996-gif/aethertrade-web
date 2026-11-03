import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AuthPage() {
  const [recovery, setRecovery] = useState(false);
  const [message, setMessage] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(
      "Authentication is not connected. No credentials were sent, no session was created and no recovery email was sent.",
    );
  }
  return (
    <div className="container-page mx-auto max-w-lg py-16">
      <LockKeyhole className="mb-6 size-8 text-primary" />
      <p className="eyebrow">Administrator access</p>
      <h1 className="mt-3 text-3xl font-semibold">
        {recovery ? "Recover your account" : "Sign in to AETHER-TRADE"}
      </h1>
      <p className="mt-4 text-sm text-warning">
        Not connected · form preview only. Do not enter real passwords.
      </p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <label className="grid gap-2 text-sm">
          Email
          <Input type="email" required autoComplete="off" />
        </label>
        {!recovery && (
          <label className="grid gap-2 text-sm">
            Password
            <Input type="password" required autoComplete="off" />
          </label>
        )}
        <Button className="w-full" type="submit">
          <LockKeyhole />
          {recovery ? "Preview recovery" : "Preview sign-in"}
        </Button>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </form>
      <Button
        variant="link"
        className="mt-3 px-0"
        onClick={() => {
          setRecovery(!recovery);
          setMessage("");
        }}
      >
        {recovery ? "Back to sign-in" : "Forgot password?"}
      </Button>
      <div className="mt-8 border-t border-border pt-6">
        <Button asChild variant="outline" className="w-full">
          <Link to="/admin">
            Open public demo workspace <ArrowRight />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          No public registration. Real access will require a securely provisioned administrator
          account.
        </p>
      </div>
    </div>
  );
}
