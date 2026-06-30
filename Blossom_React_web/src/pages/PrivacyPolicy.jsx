import PageNav from "../components/PageNav";

const sectionStyle = { marginBottom: "24px" };
const headingStyle = { marginBottom: "8px" };

function PrivacyPolicy() {
  return (
    <div>
      <PageNav />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px", lineHeight: 1.6 }}>
        <h1>Privacy Policy</h1>
        <p style={{ color: "#666" }}>Last updated: June 26, 2026</p>

        <section style={sectionStyle}>
          <p>
            Blossom ("we", "us", "our") operates the Blossom dating application
            (the "Service"), available on the web and as an Android app. This
            Privacy Policy explains what information we collect, how we use
            it, and the choices you have.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Information We Collect</h2>
          <p><b>Account information:</b> username, email address, phone number, password (stored as a one-way hash, never in plain text), and date of birth (used only to confirm you are 18 or older).</p>
          <p><b>Profile information:</b> bio, age, gender, sexual orientation, height, occupation, education, lifestyle preferences, relationship goals, languages, city/country, and any photos you upload.</p>
          <p><b>Usage information:</b> likes, matches, messages you send to other users, and any blocks or reports you submit.</p>
          <p>We do not knowingly collect any information from anyone under 18. Signup is blocked for anyone who does not confirm a date of birth indicating they are 18 or older.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>How We Use Your Information</h2>
          <ul>
            <li>To create and operate your account</li>
            <li>To show your profile to other users and suggest matches</li>
            <li>To deliver messages between matched users</li>
            <li>To send verification codes (signup, password reset) by SMS or email</li>
            <li>To enforce our safety rules - acting on blocks and reports, and removing accounts that violate our terms</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Sharing With Third Parties</h2>
          <p>We use the following service providers to operate Blossom. They process data only as needed to provide their service to us:</p>
          <ul>
            <li><b>Cloudinary</b> - stores and serves the photos you upload</li>
            <li><b>Brevo</b> - sends verification and password-reset emails</li>
            <li><b>Vonage / Infobip</b> - sends verification codes by SMS</li>
            <li><b>Render</b> - hosts our backend server and database</li>
          </ul>
          <p>We do not sell your personal information to anyone.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Other Users Can See</h2>
          <p>Your profile (photos, bio, and the details you fill in), and any messages you send to a match. Your email, phone number, and password are never shown to other users.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Blocking and Reporting</h2>
          <p>You can block another user at any time from their profile - once blocked, neither of you will see the other in Browse, Likes, or Matches, and you can no longer message each other. You can also report a profile for inappropriate behavior; reports are reviewed and may result in the reported account being removed.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Child Safety</h2>
          <p>
            Blossom is strictly for adults aged 18 and older. We do not knowingly
            allow minors to create accounts, and age is verified at signup via
            date of birth.
          </p>
          <p>
            Blossom has <b>zero tolerance</b> for child sexual abuse material
            (CSAM) or any form of child sexual exploitation. Any account found
            to be involved in such activity is immediately banned and reported
            to the National Center for Missing &amp; Exploited Children (NCMEC)
            and/or relevant law enforcement authorities.
          </p>
          <p>
            You can report a profile for any reason, including suspected child
            safety violations, directly from that profile using the{" "}
            <b>Report</b> button. You can also report concerns directly to our
            designated point of contact at{" "}
            <a href="mailto:mourad.meknioui@gmail.com?subject=Child%20Safety%20Report">
              mourad.meknioui@gmail.com
            </a>
            . We review and act on all reports, including removing violating
            accounts and content.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Data Retention &amp; Deletion</h2>
          <p>
            You can permanently delete your account at any time from the
            "Danger Zone" section of your Profile page (on web and in the
            mobile app). Deleting your account removes your profile, photos,
            bio, matches, likes, and all messages you've sent. This action
            cannot be undone.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Security</h2>
          <p>Passwords are hashed before storage and are never stored or transmitted in plain text. Access to the app is authenticated using signed tokens that expire automatically.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Changes to This Policy</h2>
          <p>We may update this policy from time to time. Continued use of Blossom after a change means you accept the updated policy.</p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Contact Us</h2>
          <p>
            Questions about this policy or your data? Email us at{" "}
            <a href="mailto:mourad.meknioui@gmail.com">mourad.meknioui@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
