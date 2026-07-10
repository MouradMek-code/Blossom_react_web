import PageNav from "../components/PageNav";
import Footer from "../components/Footer";

const sectionStyle = { marginBottom: "24px" };
const headingStyle = { marginBottom: "8px" };

function Terms() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PageNav />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px", lineHeight: 1.6 }}>
        <h1>Terms of Service</h1>
        <p style={{ color: "var(--text-muted)" }}>Last updated: July 10, 2026</p>

        <section style={sectionStyle}>
          <p>
            Welcome to Blossom ("we", "us", "our"). By creating an account or
            using the Blossom dating application (the "Service"), available on
            the web and as an Android app, you agree to these Terms of Service.
            If you do not agree, please do not use the Service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>1. You Must Be 18 or Older</h2>
          <p>
            Blossom is strictly for adults. You must be at least 18 years old to
            create an account. We verify your date of birth at signup, and
            accounts belonging to anyone under 18 are not permitted and will be
            removed.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>2. Your Account</h2>
          <p>
            You are responsible for keeping your login credentials secure and for
            all activity that happens under your account. Provide accurate
            information, and do not impersonate anyone or create an account on
            someone else's behalf.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>3. Community Rules &amp; Conduct</h2>
          <p>When using Blossom, you agree that you will not:</p>
          <ul>
            <li>Harass, threaten, or abuse other users</li>
            <li>Post content that is hateful, sexually explicit, violent, or illegal</li>
            <li>Upload photos that are not of you or that you do not have the right to share</li>
            <li>Solicit money, run scams, or send spam or advertising</li>
            <li>Use the Service for any commercial purpose without our permission</li>
            <li>Attempt to access accounts, data, or systems that are not yours</li>
          </ul>
          <p>
            You can block or report any user directly from their profile. We
            review reports and may remove content or suspend accounts that
            violate these rules.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>4. Zero Tolerance for Child Safety Violations</h2>
          <p>
            Blossom has <b>zero tolerance</b> for child sexual abuse material
            (CSAM) or any form of child sexual exploitation. Any such account is
            immediately banned and reported to the National Center for Missing
            &amp; Exploited Children (NCMEC) and/or relevant law enforcement.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>5. Content You Share</h2>
          <p>
            You keep ownership of the photos and information you upload. By
            sharing them on Blossom, you grant us permission to host and display
            that content to other users as part of operating the Service. You are
            responsible for the content you post.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>6. Ending Your Account</h2>
          <p>
            You can permanently delete your account at any time from the "Danger
            Zone" section of your Profile page (on web and in the mobile app).
            This removes your profile, photos, matches, likes, and messages, and
            cannot be undone. We may also suspend or terminate accounts that
            violate these Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>7. Disclaimers &amp; Limitation of Liability</h2>
          <p>
            Blossom is provided "as is" without warranties of any kind. We do not
            conduct criminal background checks on users, and we are not
            responsible for the conduct of any user. Always meet new people
            safely — in public, and let someone know where you are. To the extent
            permitted by law, Blossom is not liable for any damages arising from
            your use of the Service.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>8. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of Blossom
            after a change means you accept the updated Terms.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>9. Contact Us</h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a href="mailto:mourad.meknioui@gmail.com">mourad.meknioui@gmail.com</a>.
          </p>
        </section>
      </div>
      <Footer />
    </div>
  );
}

export default Terms;
