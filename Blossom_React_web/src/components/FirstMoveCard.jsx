import { useTranslation } from "react-i18next";
import { Icon } from "../ui";
import styles from "./FirstMoveCard.module.css";

// An empty chat between a woman and a man (dating): on Blossom, she writes
// first. Said to her ("You make the first move" + a few ideas that fill the
// message box) and to him ("Sara writes first - you'll be told").
export default function FirstMoveCard({ move, name, onPick }) {
  const { t } = useTranslation();
  if (move !== "you" && move !== "them") return null;
  const yours = move === "you";
  return (
    <div className={`${styles.card} ${yours ? styles.cardYou : styles.cardThem}`}>
      <span className={`${styles.icon} ${yours ? styles.iconYou : styles.iconThem}`} aria-hidden="true">
        <Icon name={yours ? "message-circle" : "clock"} size={22} />
      </span>
      <h2 className={styles.title}>{yours ? t("firstMove.youTitle") : t("firstMove.themTitle", { name })}</h2>
      <p className={styles.text}>{yours ? t("firstMove.youText", { name }) : t("firstMove.themText", { name })}</p>
      {yours && (
        <>
          <p className={styles.ideas}>{t("firstMove.ideas")}</p>
          <div className={styles.chips}>
            {[1, 2, 3].map((n) => {
              const line = t(`firstMove.ice${n}`, { name });
              return (
                <button key={n} type="button" className={styles.chip} onClick={() => onPick?.(line)}>
                  {line}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
