import { useCallback, useEffect, useState } from "react";
import PageNav from "../components/PageNav";
import styles from "./MatchedList.module.css";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/config";
function MatchedList() {
  const [listMatchedProfiles, setListMatchedProfiles] = useState(null);
  const token = sessionStorage.getItem("token");
  const navigate = useNavigate();
  async function openConversation(profile) {
    try {
      const resp = await fetch(`${BASE_URL}/profile/profile/${profile.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail);
      }

      navigate(`/chat/${data.conversation_id}`);
    } catch (err) {
    }
  }
  const fetchMatchedProfile = useCallback(async () => {
    try {
      const resp = await fetch(`${BASE_URL}/profile/profiles/matched`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data_profile_match = await resp.json();
      setListMatchedProfiles(data_profile_match);
      if (resp.status !== 200)
        throw new Error(
          `error happeneded on matching service : ${data_profile_match.detail[0].msg}`,
        );
    } catch (err) {
      sessionStorage.setItem("token", null);
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchMatchedProfile();
  }, [token, navigate, fetchMatchedProfile]);
  return (
    <div>
      <PageNav />
      <div className={styles.container}>
        {listMatchedProfiles?.map((profile) => (
          <div key={profile.id} className={styles.card}>
            <div
              className={styles.imageWrapper}
              onClick={() => navigate(`/profile/${profile.id}`)}
            >
              <img
                src={profile.photos?.[0]?.image_url}
                alt={profile.first_name}
                className={styles.image}
              />

              <div className={styles.overlay}>
                <div className={styles.profileInfo}>
                  <h3>
                    {profile.first_name}
                    <span>{profile.age}</span>
                  </h3>

                  <p className={styles.location}>
                    📍 {profile.city}, {profile.country}
                  </p>

                  {profile.occupation && (
                    <div className={styles.tag}>💼 {profile.occupation}</div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              className={styles.messageButton}
              onClick={() => openConversation(profile)}
            >
              💬 Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MatchedList;
