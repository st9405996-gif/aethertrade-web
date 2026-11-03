import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPage() {
  const [message, setMessage] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(
      "No verified recovery session is available. No password was changed. Connect authentication and request a real recovery link before using this page.",
    );
  }
  return (
    <div className="container-page max-w-lg py-16">
      <p className="eyebrow">Account recovery</p>
      <h1 className="mt-4 text-3xl font-semibold">Set a new password</h1>
      <p className="mt-4 text-sm text-warning">
        Disconnected preview · no recovery session verified.
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="grid gap-2 text-sm">
          New password (preview only)
          <Input type="password" minLength={8} required autoComplete="off" />
        </label>
        <Button type="submit">Preview password reset</Button>
        {message && (
          <p role="status" className="text-sm text-muted-foreground">
            {message}
          </p>
        )}
      </form>
      <Link to="/auth" className="mt-6 inline-block text-sm text-primary">
        Back to administrator access
      </Link>
    </div>
  );
}
