import PageNav from "../components/PageNav";
import { CONTACT_EMAIL, SUPPORT_EMAIL } from "../api/links";

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
          <h2 style={headingStyle}>Option 1: Delete it yourself (fastest)</h2>
          <p><b>In the Android app:</b></p>
          <ol>
            <li>Log in to Blossom and open your <b>Profile</b></li>
            <li>Tap <b>Settings</b></li>
            <li>At the very bottom, tap <b>Delete account</b></li>
            <li>Type the confirmation word and tap <b>Yes, delete my account forever</b></li>
          </ol>
          <p><b>On the website:</b> log in, open <b>Settings</b>, go to the <b>Delete account</b> section, then confirm.</p>
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
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Delete%20my%20Blossom%20account`}>
              {SUPPORT_EMAIL}
            </a>{" "}
            (or {CONTACT_EMAIL}){" "}
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
            <li>Your saved places, your verification selfie if one is waiting, and your phone's notification settings</li>
          </ul>
          <p>This action is permanent and cannot be reversed.</p>
        </section>
      </div>
    </div>
  );
}

export default DeleteAccount;
