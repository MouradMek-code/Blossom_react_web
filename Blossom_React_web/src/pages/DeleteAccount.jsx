import PageNav from "../components/PageNav";

const sectionStyle = { marginBottom: "24px" };
const headingStyle = { marginBottom: "8px" };

function DeleteAccount() {
  return (
    <div>
      <PageNav />
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px", lineHeight: 1.6 }}>
        <h1>Delete Your Account</h1>
        <p style={{ color: "#666" }}>
          You can permanently delete your Blossom account and all associated data at any time.
        </p>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Option 1: Delete it yourself in the app (fastest)</h2>
          <ol>
            <li>Log in to Blossom (web or the Android app)</li>
            <li>Go to your <b>Profile</b> page</li>
            <li>Scroll to the <b>Danger Zone</b> section</li>
            <li>Tap/click <b>Delete Account</b> and confirm</li>
          </ol>
          <p>
            This is instant and permanent - your profile, photos, bio, matches, likes, and every
            message you've sent are all removed immediately. This cannot be undone.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>Option 2: Request deletion without logging in</h2>
          <p>
            If you can't or don't want to log in, you can request deletion by email instead. Send
            a message to{" "}
            <a href="mailto:mourad.meknioui@gmail.com?subject=Delete%20my%20Blossom%20account">
              mourad.meknioui@gmail.com
            </a>{" "}
            from the email address associated with your account, with the subject line
            "Delete my Blossom account". Include your username or phone number so we can find
            your account. We will delete your account and all associated data within 7 days and
            confirm by email once it's done.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={headingStyle}>What gets deleted</h2>
          <ul>
            <li>Your profile (bio, photos, preferences, all profile fields)</li>
            <li>Your account (username, email, phone number, password)</li>
            <li>All your matches and likes</li>
            <li>All messages you've sent</li>
          </ul>
          <p>This action is permanent and cannot be reversed.</p>
        </section>
      </div>
    </div>
  );
}

export default DeleteAccount;
