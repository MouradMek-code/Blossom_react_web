import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IMG } from "../api/images";
import {
  deletePhoto,
  fetchOwnPhotos,
  findSavedPhoto,
  isImageFile,
  uploadPhoto,
} from "../api/photoUpload";
import styles from "./MultiImageUpload.module.css";

const MAX = 6;
const MIN_REQUIRED = 2;

let nextKey = 0;

export default function ImageUploader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // [{ key, url, status: "done" | "uploading" | "failed", id?, file?, message? }]
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Ids of the photos already on the server (null until known).
  const knownIds = useRef(null);
  const mounted = useRef(true);
  const inputRef = useRef(null);

  function update(key, changes) {
    if (!mounted.current) return;
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...changes } : s)));
  }

  // Photos already uploaded (coming back to this step, or saved after a
  // dropped connection) show straight away.
  useEffect(() => {
    mounted.current = true;
    fetchOwnPhotos()
      .then((photos) => {
        if (!mounted.current) return;
        knownIds.current = new Set(photos.map((p) => p.id));
        setSlots((prev) => [
          ...photos.slice(0, MAX).map((p) => ({ key: `s${p.id}`, id: p.id, url: IMG.thumb(p.image_url), status: "done" })),
          ...prev.filter((s) => !knownIds.current.has(s.id)),
        ]);
      })
      .catch(() => {})
      .finally(() => mounted.current && setLoading(false));
    return () => {
      mounted.current = false;
    };
  }, []);

  function saved(key, photo) {
    knownIds.current?.add(photo.id);
    sessionStorage.setItem("profilecreated", "yes");
    update(key, { status: "done", id: photo.id, message: "" });
  }

  async function send(key, file) {
    update(key, { status: "uploading", message: "" });
    try {
      saved(key, await uploadPhoto(file, knownIds.current));
    } catch (err) {
      update(key, { status: "failed", message: err.message || t("photos.connection") });
    }
  }

  function addPhotos(e) {
    setError("");
    const chosen = Array.from(e.target.files || []);
    e.target.value = "";
    const files = chosen.filter(isImageFile).slice(0, MAX - slots.length);
    if (chosen.length && !files.length) {
      setError(t("photos.notImage"));
      return;
    }
    const added = files.map((file) => ({
      key: `n${nextKey++}`,
      url: URL.createObjectURL(file),
      file,
      status: "uploading",
    }));
    if (!added.length) return;
    setSlots((prev) => [...prev, ...added].slice(0, MAX));
    added.forEach((s) => send(s.key, s.file));
  }

  // A photo that "failed" may have reached the server after all: look first,
  // then send it again. (Not while others are uploading - a new photo on the
  // server could be theirs.)
  async function retry(slot) {
    const othersUploading = slots.some((s) => s.status === "uploading" && s.key !== slot.key);
    update(slot.key, { status: "uploading", message: "" });
    if (knownIds.current && !othersUploading) {
      const found = await findSavedPhoto(knownIds.current, { waits: [0] });
      if (found) return saved(slot.key, found);
    }
    send(slot.key, slot.file);
  }

  async function remove(slot) {
    setError("");
    setSlots((prev) => prev.filter((s) => s.key !== slot.key));
    if (slot.status !== "done") return;
    try {
      await deletePhoto(slot.id);
      knownIds.current?.delete(slot.id);
    } catch {
      // Still on the server: put it back and say so.
      if (!mounted.current) return;
      setSlots((prev) => [...prev, slot]);
      setError(t("photos.deleteFailed"));
    }
  }

  const doneCount = slots.filter((s) => s.status === "done").length;
  const uploading = slots.some((s) => s.status === "uploading");
  const missing = Math.max(0, MIN_REQUIRED - doneCount);
  const failed = slots.find((s) => s.status === "failed");

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>{t("photos.title")}</h2>
        <p className={styles.subtitle}>{t("photos.subtitle", { min: MIN_REQUIRED, max: MAX })}</p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={addPhotos}
        />

        <div className={styles.grid}>
          {Array.from({ length: MAX }).map((_, index) => {
            const slot = slots[index];
            if (!slot) {
              return (
                <button
                  key={`empty${index}`}
                  type="button"
                  className={`${styles.box} ${styles.addBox}`}
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                  aria-label={t("photos.add")}
                >
                  {loading && index === 0 ? <span className={styles.spinnerDark} /> : <span className={styles.plus}>+</span>}
                </button>
              );
            }
            return (
              <div key={slot.key} className={styles.box}>
                <img src={slot.url} alt="" className={styles.image} />
                {slot.status === "uploading" && (
                  <div className={styles.overlay}>
                    <span className={styles.spinner} />
                  </div>
                )}
                {slot.status === "failed" && (
                  <button type="button" className={`${styles.overlay} ${styles.failedOverlay}`} onClick={() => retry(slot)}>
                    <span className={styles.failedIcon}>↻</span>
                    <span className={styles.failedText}>{t("photos.tapToRetry")}</span>
                  </button>
                )}
                {slot.status !== "uploading" && (
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => remove(slot)}
                    aria-label={t("photos.remove")}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {failed && <p className={styles.error}>{failed.message || t("photos.connection")}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {missing > 0 || uploading ? (
          <p className={styles.hint}>
            {uploading ? t("photos.uploading") : t(missing === 1 ? "photos.addOne" : "photos.addMore", { count: missing })}
          </p>
        ) : (
          <button type="button" className={styles.button} onClick={() => navigate("/profiles")}>
            {t("photos.continue")}
          </button>
        )}
      </div>
    </div>
  );
}
