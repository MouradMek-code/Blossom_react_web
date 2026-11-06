import { useTranslation } from "react-i18next";
import PageNav from "../components/PageNav";
import ConversationList from "../components/ConversationList";
import { useWide } from "../api/useWide";
import { EmptyState } from "../ui";
import styles from "./Messages.module.css";

// Chats. On a phone: the list. On a computer: the list on the left and a
// "pick a conversation" panel on the right - opening one keeps the list there
// (ChatPage), like WhatsApp Web.
function Messages() {
  const { t } = useTranslation();
  const wide = useWide();

  if (wide) {
    return (
      <div className={styles.splitPage}>
        <PageNav hideTabBar />
        <div className={styles.split}>
          <aside className={styles.side}>
            <ConversationList compact />
          </aside>
          <main className={styles.pick}>
            <EmptyState icon="message-circle" title={t("messages.pickTitle")} text={t("messages.pickText")} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageNav />
      <div className={styles.container}>
        <ConversationList />
      </div>
    </div>
  );
}

export default Messages;
