import styles from "./Testimonials.module.css";

const STORIES = [
  {
    emoji: "👩‍❤️‍👨",
    quote: "I wasn't expecting much, but within two weeks I matched with someone who actually reads. We've been together 8 months.",
    name: "Layla & Marcus",
    detail: "London · met on Blossom",
  },
  {
    emoji: "💑",
    quote: "The fact that women make the first move changed everything. It felt respectful from day one.",
    name: "Camille & Théo",
    detail: "Paris · met on Blossom",
  },
  {
    emoji: "🥂",
    quote: "We matched on a Friday, had coffee on Sunday, and never stopped talking since. Simple as that.",
    name: "Aisha & Daniel",
    detail: "Dubai · met on Blossom",
  },
];

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Real people. Real stories. 💌</h2>
      <div className={styles.grid}>
        {STORIES.map((s) => (
          <div key={s.name} className={styles.card}>
            <div className={styles.emoji}>{s.emoji}</div>
            <p className={styles.quote}>"{s.quote}"</p>
            <div className={styles.meta}>
              <strong className={styles.name}>{s.name}</strong>
              <span className={styles.detail}>{s.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
