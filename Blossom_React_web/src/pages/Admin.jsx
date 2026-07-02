import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "../components/PageNav";
import { BASE_URL } from "../api/config";

const th = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: "700",
  textTransform: "uppercase",
  color: "#888",
  borderBottom: "2px solid #f0f0f0",
};
const td = {
  padding: "12px 16px",
  borderBottom: "1px solid #f5f5f5",
  fontSize: "14px",
  verticalAlign: "middle",
};

export default function Admin() {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetch(`${BASE_URL}/user/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 403) throw new Error("forbidden");
        return r.json();
      })
      .then(setUsers)
      .catch((e) => {
        if (e.message === "forbidden") navigate("/");
        else setError("Failed to load users.");
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  async function handleDelete(userId, username) {
    if (!window.confirm(`Delete user "${username}" and all their data? This cannot be undone.`)) return;
    setDeletingId(userId);
    try {
      const resp = await fetch(`${BASE_URL}/user/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Failed to delete user.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.profile?.first_name?.toLowerCase().includes(q) ||
      u.profile?.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
      <PageNav />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#222" }}>
              🛡️ Admin Panel
            </h1>
            <p style={{ margin: "4px 0 0", color: "#888", fontSize: "14px" }}>
              {users.length} users total
            </p>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1.5px solid #e0e0e0",
              fontSize: "14px",
              width: "280px",
              outline: "none",
            }}
          />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {loading ? (
          <p style={{ color: "#888", textAlign: "center", marginTop: "60px" }}>Loading...</p>
        ) : (
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 2px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Photo</th>
                  <th style={th}>Name</th>
                  <th style={th}>Username</th>
                  <th style={th}>Email</th>
                  <th style={th}>Location</th>
                  <th style={th}>Gender / Age</th>
                  <th style={th}>Joined</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...td, textAlign: "center", color: "#aaa", padding: "40px" }}>
                      No users found
                    </td>
                  </tr>
                )}
                {filtered.map((u) => (
                  <tr key={u.id} style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={td}>
                      {u.profile?.photo ? (
                        <img
                          src={u.profile.photo}
                          alt={u.profile.first_name}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#f0e0f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                          🌸
                        </div>
                      )}
                    </td>
                    <td style={{ ...td, fontWeight: "600" }}>{u.profile?.first_name || "—"}</td>
                    <td style={td}>{u.username}</td>
                    <td style={{ ...td, color: "#666" }}>{u.email}</td>
                    <td style={td}>{u.profile ? `${u.profile.city || "—"}, ${u.profile.country || "—"}` : "—"}</td>
                    <td style={td}>{u.profile ? `${u.profile.gender || "—"} · ${u.profile.age || "—"}` : "—"}</td>
                    <td style={{ ...td, color: "#888", fontSize: "13px" }}>
                      {u.profile?.created_at ? new Date(u.profile.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={td}>
                      {u.is_admin ? (
                        <span style={{ color: "#e91e63", fontWeight: "700", fontSize: "13px" }}>Admin</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          disabled={deletingId === u.id}
                          style={{
                            padding: "7px 16px",
                            borderRadius: "999px",
                            border: "1.5px solid #ff4444",
                            background: "transparent",
                            color: "#ff4444",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#ff4444"; e.currentTarget.style.color = "#fff"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#ff4444"; }}
                        >
                          {deletingId === u.id ? "Deleting..." : "Delete"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
