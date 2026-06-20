import { useState } from "react";
import styles from "./FormSignUp.module.css";
import styles2 from "./VerifyPhone.module.css";
const BASE_URL = "http://localhost:8000";

function FormSignUp({ setRegistered, error, setError, verify, setVerified }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

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
          phone_number: phoneNumber,
        }),
      };
      try {
        const resp = await fetch(`${BASE_URL}/user/send_email`, requestOptions);
        const data = await resp.json();

        if (resp.status !== 200) {
          console.log(data);
          throw new Error(`error happeneded on sign up : ${data.detail}`);
        }
        setVerified((c) => !c);
        sessionStorage.setItem("token", data.access_token);
      } catch (err) {
        setError(err);
      }
    }
    SignUp();
  }

  return (
    <div>
      <h1 className={styles.title}>REGISTER HERE</h1>
      {verify === false && (
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
          <div className={styles.group}>
            <label>Phone Number</label>
            <input
              type="phonenumber"
              value={phoneNumber}
              placeholder="+381690156360"
              onChange={(e) => setPhoneNumber(e.target.value)}
            ></input>
          </div>
          <div className={styles.registerform}>
            <button onClick={(e) => FormHandler(e)}> Register </button>
          </div>
        </form>
      )}

      {verify === true && (
        <VerificationForm
          username={username}
          email={email}
          password={password}
          phoneNumber={phoneNumber}
          setError={setError}
          setRegistered={setRegistered}
        />
      )}
    </div>
  );
}
function VerificationForm({
  username,
  email,
  password,
  phoneNumber,
  setError,
  setRegistered,
}) {
  const [code, setCode] = useState("");
  const SignUp = async () => {
    setError("");

    const requestPin = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp: code,
        email: email,
      }),
    };
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
        phone_number: phoneNumber,
      }),
    };
    console.log(requestOptions);
    console.log(requestPin);
    try {
      const resp1 = await fetch(`${BASE_URL}/user/verify-email`, requestPin);
      const data1 = await resp1.json();
      console.log(data1);
      if (resp1.status !== 200)
        throw new Error(`error happeneded on sign up : ${data1.detail}`);
      const resp = await fetch(`${BASE_URL}/user`, requestOptions);
      const data = await resp.json();
      console.log(data);
      if (resp.status !== 200)
        throw new Error(`error happeneded on sign up : ${data.detail}`);
      setRegistered((c) => !c);
      sessionStorage.setItem("token", data.access_token);
    } catch (err) {
      setError(err);
    }
  };
  return (
    <div className={styles2.container}>
      <div className={styles2.card}>
        <div className={styles2.icon}>🔐</div>

        <h1 className={styles2.title}>Verify your email/phone</h1>

        <p className={styles2.subtitle}>
          Enter the 6-digit verification code sent to your phone/email
        </p>

        <input
          className={styles2.input}
          placeholder="••••••"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value)}
        />

        <button className={styles2.button} onClick={SignUp}>
          Continue
        </button>

        <p className={styles2.footerText}>
          Didn’t receive the code? <span style={styles.link}>Resend</span>
        </p>
      </div>
    </div>
  );
}

export default FormSignUp;
