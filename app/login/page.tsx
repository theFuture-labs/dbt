import Link from "next/link";
import GoogleButton from "./google-button";

export const metadata = { title: "Sign in | diBiti" };

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-page">
      <div className="moon-mini" aria-hidden="true" />
      <div className="auth-panel">
        <p className="brand">diBiti</p>
        <h1>Sign in to your team</h1>
        <p className="muted">
          Use your Google account. We never see your password, and you choose
          what to connect later.
        </p>
        {error ? (
          <p className="form-error" role="alert">
            Sign-in did not finish. Please try again.
          </p>
        ) : null}
        <GoogleButton />
        <p className="fine">
          By continuing you agree to our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
