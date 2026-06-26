import { useState } from "react";
import styles from "./FormSignUp.module.css";
import styles2 from "./VerifyPhone.module.css";
import { BASE_URL } from "../api/config";
import { saveSignupDraft, clearSignupDraft } from "../api/signupDraft";

function FormSignUp({ setRegistered, error, setError, verify, setVerified, prefill }) {
  const [username, setUsername] = useState(prefill?.username || "");
  const [email, setEmail] = useState(prefill?.email || "");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(prefill?.phoneNumber || "");
  const [dateOfBirth, setDateOfBirth] = useState(prefill?.dateOfBirth || "");

  function FormHandler(e) {
    e.preventDefault();
    async function SignUp() {
      setError("");

      const today = new Date();
      const birth = new Date(dateOfBirth);
      const age =
        today.getFullYear() -
        birth.getFullYear() -
        (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
          ? 1
          : 0);
      if (!dateOfBirth || isNaN(birth.getTime()) || age < 18) {
        setError(new Error("You must be at least 18 years old to sign up"));
        return;
      }

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          phone_number: phoneNumber,
          date_of_birth: dateOfBirth,
        }),
      };
      try {
        const resp = await fetch(`${BASE_URL}/user/send_email`, requestOptions);
        const data = await resp.json();

        if (resp.status !== 200) {
          throw new Error(`error happeneded on sign up : ${data.detail}`);
        }
        // The account doesn't exist yet and there's no token until the
        // OTP is verified - save just enough (no password) to resume
        // straight at the verification screen if the user leaves now.
        saveSignupDraft({ stage: "verify_otp", username, email, phoneNumber, dateOfBirth });
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
          <div className={styles.group}>
            <label>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
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
          dateOfBirth={dateOfBirth}
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
  dateOfBirth,
  setError,
  setRegistered,
}) {
  const [code, setCode] = useState("");
  // Resuming after a reload means the password was never persisted (by
  // design - we don't store it locally), so it has to be re-entered here
  // to finish account creation. On a fresh, uninterrupted signup it's
  // already known from the previous step and this field stays hidden.
  const [passwordInput, setPasswordInput] = useState("");
  const needsPassword = !password;

  const SignUp = async () => {
    setError("");
    const effectivePassword = password || passwordInput;

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
        password: effectivePassword,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
      }),
    };
    try {
      const resp1 = await fetch(`${BASE_URL}/user/verify-email`, requestPin);
      const data1 = await resp1.json();
      if (resp1.status !== 200)
        throw new Error(`error happeneded on sign up : ${data1.detail}`);
      const resp = await fetch(`${BASE_URL}/user`, requestOptions);
      const data = await resp.json();
      if (resp.status !== 200)
        throw new Error(`error happeneded on sign up : ${data.detail}`);
      clearSignupDraft();
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

        {needsPassword && (
          <input
            className={styles2.input}
            type="password"
            placeholder="Re-enter your password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
        )}

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
