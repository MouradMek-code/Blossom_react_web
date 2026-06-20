import { useState } from "react";
import styles from "./FormSignUp.module.css";
import { useNavigate } from "react-router";
const BASE_URL = "http://localhost:8000";
function FormLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  function HandleLogin(e) {
    e.preventDefault();
    async function Login() {
      setError("");
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);
      const requestOptionsLogin = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      };
      try {
        const resp = await fetch(`${BASE_URL}/login`, requestOptionsLogin);
        const data = await resp.json();
        console.log(data);
        sessionStorage.setItem("token", data.access_token);
        if (resp.status !== 200)
          throw new Error(`error happeneded on login : ${data.detail[0].msg}`);
        navigate("/profile");
      } catch (err) {
        setError(err);
      } finally {
        setUsername("");
        setPassword("");
      }
    }
    Login();
  }
  return (
    <div>
      <h1 className={styles.title}>LOGIN HERE</h1>
      <form className={styles.container} onSubmit={(e) => HandleLogin(e)}>
        {error !== "" && (
          <span className={styles.error}>{error.toString()}</span>
        )}
        <div className={styles.group}>
          <label>Name</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          ></input>
        </div>
        <div className={styles.group}>
          <label>Password</label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
          ></input>
        </div>
        <div className={styles.registerform}>
          <button onClick={(e) => HandleLogin(e)}> Login </button>
        </div>
      </form>
    </div>
  );
}
export default FormLogin;
