"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Could not start Google sign-in. Try again in a moment.");
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
