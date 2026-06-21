import { useState } from "react";
import styles from "./FormSignUp.module.css";
import { BASE_URL } from "../api/config";

function FormSignUp({ setRegistered, error, setError }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+381690156360");

  function FormHandler(e) {
    e.preventDefault();
    async function SignUp() {
      setError("");
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      };
      try {
        const resp = await fetch(`${BASE_URL}/user`, requestOptions);
        const data = await resp.json();
        if (resp.status !== 200)
          throw new Error(`error happeneded on sign up : ${data.detail}`);
        setRegistered((c) => !c);
        sessionStorage.setItem("token", data.access_token);
      } catch (err) {
        setError(err);
      } finally {
        setUsername("");
        setEmail("");
        setPassword("");
      }
    }
    SignUp();
  }

  return (
    <div>
      <h1 className={styles.title}>REGISTER HERE</h1>

      <form className={styles.container} onSubmit={(e) => FormHandler(e)}>
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
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          ></input>
        </div>
        <div className={styles.group}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          ></input>
        </div>
        <div className={styles.registerform}>
          <button onClick={(e) => FormHandler(e)}> Register </button>
        </div>
      </form>
    </div>
  );
}
export default FormSignUp;
