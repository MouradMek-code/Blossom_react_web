import styles from "./HowItWorks.module.css";

const STEPS = [
  {
    icon: "🌹",
    title: "Build your profile",
    text: "Tell us who you are, what you're into, and what you're looking for.",
  },
  {
    icon: "💘",
    title: "Match with intent",
    text: "Browse profiles and like the ones who share your vibe - no endless swiping.",
  },
  {
    icon: "📅",
    title: "Plan a real date",
    text: "Matched? Chat for a bit, then take it offline - that's the whole point.",
  },
];

function HowItWorks() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>How Blossom works</h2>
      <div className={styles.grid}>
        {STEPS.map((step, i) => (
          <div key={step.title} className={styles.card} style={{ animationDelay: `${i * 0.15}s` }}>
            <div className={styles.icon}>{step.icon}</div>
            <h3 className={styles.cardTitle}>{step.title}</h3>
            <p className={styles.cardText}>{step.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
