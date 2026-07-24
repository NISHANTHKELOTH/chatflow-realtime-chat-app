import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function Login({ onRegister, onForgotPassword, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      // Login request
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Save login information
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setMessage("Login successful! 🎉");

        // Send logged-in user to App.jsx
        if (onLogin) {
          onLogin(data.user);
        }
      } else {
        setMessage(data.message);
      }

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">

        <div className="chat-logo">
          💬
        </div>

        <h1>ChatFlow</h1>

        <p className="subtitle">
          Welcome back! Sign in to continue chatting.
        </p>

        <form onSubmit={handleLogin}>

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </div>

          <div className="forgot-password">
            <span onClick={onForgotPassword}>
              Forgot password?
            </span>
          </div>

          {message && (
            <p className="form-message">
              {message}
            </p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>

        </form>

        <p className="register-text">
          New to ChatFlow?{" "}

          <span onClick={onRegister}>
            Create an account
          </span>
        </p>

      </div>
    </div>
  );
}

export default Login;