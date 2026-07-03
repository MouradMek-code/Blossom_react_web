import { useState } from "react";
import styles from "./FAQ.module.css";

const FAQS = [
  {
    q: "Is Blossom free to use?",
    a: "Yes — creating a profile, browsing, and matching are completely free. We'll never charge you to send a like.",
  },
  {
    q: "Who makes the first move?",
    a: "Women always send the first message. This keeps the experience respectful and intentional for everyone.",
  },
  {
    q: "How does matching work?",
    a: "When you like someone and they like you back, it's a match! You'll get a notification and can start chatting straight away.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. We never sell your data. Your profile is only visible to registered members, and you can delete your account any time.",
  },
  {
    q: "Can I use Blossom on my phone?",
    a: "Yes! Our Android app is available on Google Play. An iOS version is coming soon.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to your profile settings and tap 'Delete Account'. Your data is permanently removed within 24 hours.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Frequently asked questions</h2>
      <div className={styles.list}>
        {FAQS.map((faq, i) => (
          <div key={i} className={`${styles.item} ${open === i ? styles.itemOpen : ""}`}>
            <button className={styles.question} onClick={() => setOpen(open === i ? null : i)}>
              <span>{faq.q}</span>
              <span className={styles.chevron}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className={styles.answer}>{faq.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
