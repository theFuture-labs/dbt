import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | DBT",
};

// TODO before submitting to Meta/Google: replace the placeholders below
// (company legal name, contact email, address) and have the text reviewed.
const COMPANY = "[Your legal company name]";
const EMAIL = "[privacy@yourdomain.com]";
const UPDATED = "October 12, 2026";

export default function Privacy() {
  return (
    <main className="wrap legal">
      <p>
        <Link href="/">← Back</Link>
      </p>
      <h1>Privacy Policy</h1>
      <p>Last updated: {UPDATED}</p>

      <p className="notice">
        This is a starter draft for DBT (working name). It must be reviewed and
        completed with your real company details before you submit it to Meta or
        Google.
      </p>

      <h2>Who we are</h2>
      <p>
        DBT is operated by {COMPANY} (&quot;we&quot;, &quot;us&quot;). You can
        contact us about privacy at {EMAIL}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details: your name, email address and sign-in identity.</li>
        <li>
          Company profile information you give us: brand voice, products,
          policies and similar business details.
        </li>
        <li>
          Content from accounts you choose to connect, such as your Instagram
          and Facebook Page posts, comments and basic performance statistics.
        </li>
        <li>
          Files you choose to share with us, such as specific Google Drive
          folders you select.
        </li>
        <li>
          A record of actions our AI agents propose and perform for you (an
          audit log).
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run the agents you set up and show you their work.</li>
        <li>To publish content only after you approve it, unless you set a rule that allows otherwise.</li>
        <li>To keep your account secure and to provide support.</li>
        <li>To bill you for paid plans.</li>
      </ul>

      <h2>Connected accounts</h2>
      <p>
        We connect to services like Meta and Google through their official
        sign-in (OAuth). We never see or store your passwords. We ask only for
        the permissions needed for the features you turn on, and you can
        disconnect at any time from your account or from the service itself.
      </p>

      <h2>AI processing</h2>
      <p>
        To generate drafts and plans, we send relevant parts of your company
        profile and connected content to AI model providers acting on our
        behalf. We do not allow them to use your data to train their models
        under the terms we use with them. Agents only receive the data they need
        for the task.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not sell your data. We share it only with service providers that
        help us operate DBT (hosting, database, payments, AI processing), and
        where the law requires.
      </p>

      <h2>Your rights and data deletion</h2>
      <p>
        You can view, correct, export and delete your company profile and stored
        data. To request deletion of your account and data, email {EMAIL}. We
        will act on deletion requests within 30 days. If you are in Nigeria, the
        European Economic Area or the UK, you have rights under the NDPR/NDPA
        and GDPR respectively, and you can contact us to exercise them.
      </p>

      <h2>Retention and security</h2>
      <p>
        We keep data while your account is active and delete it after you ask us
        to or close your account, except where we must keep records by law.
        Access tokens are encrypted and each customer&apos;s data is isolated
        from others.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page when our practices change and note the date at
        the top.
      </p>
    </main>
  );
}
