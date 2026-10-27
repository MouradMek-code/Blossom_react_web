import { Fragment } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import { CONTACT_EMAIL, SUPPORT_EMAIL } from "../api/links";
import { PRIVACY_POLICY } from "../data/privacyPolicy";

const sectionStyle = { marginBottom: "24px" };
const headingStyle = { marginBottom: "8px" };

// Emails read left to right even inside the Arabic text.
function Email({ address, subject }) {
  const href = `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
  return <a href={href} dir="ltr">{address}</a>;
}

// **bold**, {support}, {contact}, {safety} and {deletePage} (see data/privacyPolicy.js).
function rich(text) {
  return text.split(/(\*\*[^*]+\*\*|\{support\}|\{contact\}|\{safety\}|\{deletePage\})/).map((part, i) => {
    if (part.startsWith("**")) return <b key={i}>{part.slice(2, -2)}</b>;
    if (part === "{support}") return <Email key={i} address={SUPPORT_EMAIL} />;
    if (part === "{contact}") return <Email key={i} address={CONTACT_EMAIL} />;
    if (part === "{safety}") return <Email key={i} address={SUPPORT_EMAIL} subject="Child Safety Report" />;
    if (part === "{deletePage}") return <Link key={i} to="/delete-account" dir="ltr">blossom-date.com/delete-account</Link>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

// In the site's language - or the one in ?lang= (the app links here with its
// own language, which can differ from the phone's).
function PrivacyPolicy() {
  const { i18n } = useTranslation();
  const [params] = useSearchParams();
  const lang = [params.get("lang"), i18n.language?.slice(0, 2)].find((code) => PRIVACY_POLICY[code]) || "en";
  const policy = PRIVACY_POLICY[lang];

  return (
    <div>
      <PageNav />
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
        style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px 80px", lineHeight: 1.6 }}
      >
        <h1>{policy.title}</h1>
        <p style={{ color: "#666" }}>{policy.updated}</p>

        {policy.sections.map((section, s) => (
          <section key={s} style={sectionStyle}>
            {section.title && <h2 style={headingStyle}>{section.title}</h2>}
            {section.blocks.map((block, b) =>
              Array.isArray(block) ? (
                <ul key={b}>
                  {block.map((item, i) => <li key={i}>{rich(item)}</li>)}
                </ul>
              ) : (
                <p key={b}>{rich(block)}</p>
              ),
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export default PrivacyPolicy;
