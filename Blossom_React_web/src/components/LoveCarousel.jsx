import styles from "./LoveCarousel.module.css";
import { useTranslation } from "react-i18next";

const images = [
  { src: "/love-1.png", alt: "Hamsters in love" },
  { src: "/love-2.png", alt: "Hamsters hugging" },
  { src: "/love-3.png", alt: "Puppy and bunny" },
  { src: "/love-4.svg", alt: "Cats in love" },
  { src: "/love-5.svg", alt: "Penguins in love" },
  { src: "/love-6.svg", alt: "Foxes in love" },
  { src: "/love-7.svg", alt: "Bears in love" },
];

// Duplicate for seamless infinite loop
const track = [...images, ...images];

function LoveCarousel() {
  const { t } = useTranslation();
  return (
    <div className={styles.section}>
      <p className={styles.label}>{t("home.carousel")}</p>
      <div className={styles.mask}>
        <div className={styles.track}>
          {track.map((img, i) => (
            <div className={styles.card} key={i}>
              <img src={img.src} alt={img.alt} className={styles.img} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LoveCarousel;
