import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="app-header">
      <span className="brand">diBiti</span>
      <nav className="app-nav" aria-label="Main">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/queue">Approval queue</Link>
        <Link href="/audit">Audit log</Link>
      </nav>
      <form action="/auth/signout" method="post">
        <button className="btn btn-ghost btn-small" type="submit">
          Sign out
        </button>
      </form>
    </header>
  );
}
