import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import fr from "./locales/fr.json";
import zh from "./locales/zh.json";
import ar from "./locales/ar.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr }, zh: { translation: zh }, ar: { translation: ar } },
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

// Arabic reads right to left: <html dir> and <html lang> follow the language,
// so the whole page mirrors (and screen readers pronounce it right).
function applyDirection(lng) {
  const code = (lng || "en").slice(0, 2);
  document.documentElement.lang = code;
  document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
}
applyDirection(i18n.language);
i18n.on("languageChanged", applyDirection);

export default i18n;
