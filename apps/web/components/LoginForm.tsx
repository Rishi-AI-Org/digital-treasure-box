"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "unconfigured" | "failed">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    setStatus(error ? "failed" : "sent");
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>
        <span>Email</span>
        <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <button className="primary-action" type="submit" disabled={status === "sending"}>
        Send magic link
      </button>
      {status === "sent" ? <p className="muted">Magic link sent.</p> : null}
      {status === "unconfigured" ? <p className="form-error">Supabase env vars are not configured.</p> : null}
      {status === "failed" ? <p className="form-error">Login failed.</p> : null}
    </form>
  );
}
