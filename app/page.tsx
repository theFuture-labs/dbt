import Link from "next/link";

export default function Home() {
  return (
    <main className="wrap">
      <section className="hero">
        <h1>Your business, with an AI team that works for you.</h1>
        <p>
          DBT gives your business a team of AI agents that all work from one
          company profile. They draft and plan the work. You approve it. Every
          action is logged.
        </p>
        <a className="btn" href="mailto:hello@example.com">
          Join the early pilot
        </a>
      </section>

      <section className="cards">
        <div className="card">
          <h3>Social Media Manager</h3>
          <p>
            Plans your content calendar, writes posts and images, and publishes
            only after you approve.
          </p>
        </div>
        <div className="card">
          <h3>One company profile</h3>
          <p>
            Your brand voice, products and rules live in one place. Every agent
            uses them.
          </p>
        </div>
        <div className="card">
          <h3>You stay in control</h3>
          <p>
            Approval before anything goes public, and a full record of what
            every agent did.
          </p>
        </div>
      </section>

      <footer>
        <Link href="/privacy">Privacy Policy</Link>
      </footer>
    </main>
  );
}
