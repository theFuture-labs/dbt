"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError(
        "Sign-in is not configured yet: the two Supabase values are missing from this build. Add them in Vercel, then redeploy."
      );
      setBusy(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(`Could not start Google sign-in: ${error.message}`);
        setBusy(false);
      }
    } catch {
      setError("Could not start Google sign-in. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn btn-block" onClick={signIn} disabled={busy}>
        {busy ? "Opening Google..." : "Continue with Google"}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
