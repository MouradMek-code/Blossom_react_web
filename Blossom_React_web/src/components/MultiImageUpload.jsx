import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../api/config";
export default function ImageUploader() {
  const MAX = 6;
  const [images, setImages] = useState([]);
  const navigate = useNavigate();
  const handleUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const token = sessionStorage.getItem("token");

    await fetch(`${BASE_URL}/profile/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const newImage = {
      file,
      url: URL.createObjectURL(file),
    };

    setImages((prev) => {
      const updated = [...prev];
      updated[index] = newImage;
      return updated;
    });

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Upload Images (max 6)</h2>

      <div style={styles.grid}>
        {Array.from({ length: MAX }).map((_, index) => {
          const img = images[index];

          return (
            <div key={index} style={styles.box}>
              {img ? (
                <>
                  <img src={img.url} alt="" style={styles.image} />

                  <button
                    onClick={() => removeImage(index)}
                    style={styles.removeBtn}
                  >
                    ✕
                  </button>
                </>
              ) : (
                <label style={styles.addBox}>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload(e, index)}
                  />
                  <div style={styles.plus}>+</div>
                </label>
              )}
            </div>
          );
        })}
      </div>
      <div style={styles.button}>
        <button onClick={() => navigate("/profiles")}>
          {" "}
          Go Check Profiles
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    border: "solid",
  },

  button: {
    marginTop: "20px",
  },

  title: {
    marginBottom: "20px",
    fontSize: "30px",
    fontWeight: "600",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 120px)",
    gap: "12px",
  },

  box: {
    width: "120px",
    height: "120px",
    position: "relative",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #ddd",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  addBox: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  plus: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#666",
  },

  removeBtn: {
    position: "absolute",
    top: "5px",
    right: "5px",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    cursor: "pointer",
  },
};
