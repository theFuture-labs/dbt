import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="nebula" aria-hidden="true" />
        <div className="stars" aria-hidden="true" />
        <div className="moon" aria-hidden="true" />

        <div className="hero-inner">
          <p className="brand">DBT</p>
          <h1>A team that works while you sleep.</h1>
          <p className="lede">
            AI agents that run your social media, operations and books from one
            company profile. You approve every move.
          </p>
          <a className="btn" href="mailto:hello@example.com">
            Join the early pilot
          </a>
        </div>
      </section>

      <section className="section">
        <h2>Your team</h2>
        <p className="sub">
          Each agent has one job and only sees the data that job needs. All of
          them learn your brand and rules from the same profile.
        </p>
        <ul className="roster">
          <li>
            <h3>Social Media Manager</h3>
            <p>
              Plans your content calendar, writes posts and images, and
              publishes to Instagram and Facebook once you approve.
            </p>
            <span className="status live">In pilot</span>
          </li>
          <li>
            <h3>Operations</h3>
            <p>
              Tracks tasks and deadlines across your tools and sends a weekly
              status briefing with blockers flagged.
            </p>
            <span className="status">Next</span>
          </li>
          <li>
            <h3>Finance</h3>
            <p>
              Keeps records, budgets and cash-flow views. It never moves money.
            </p>
            <span className="status">Later</span>
          </li>
        </ul>
      </section>

      <section className="section">
        <h2>You stay in charge</h2>
        <p className="sub">
          Nothing goes public without your say, and everything is on the
          record.
        </p>
        <ol className="steps">
          <li>
            <strong>Agent drafts</strong>
            <span>A post, a reply or a plan, written in your brand voice.</span>
          </li>
          <li>
            <strong>You review</strong>
            <span>Approve, edit or reject from your phone.</span>
          </li>
          <li>
            <strong>It goes out</strong>
            <span>Only the exact version you approved is published.</span>
          </li>
          <li>
            <strong>It is logged</strong>
            <span>Every proposal and action stays reviewable.</span>
          </li>
        </ol>
      </section>

      <footer className="site-footer">
        <span>DBT</span>
        <Link href="/privacy">Privacy Policy</Link>
      </footer>
    </main>
  );
}
