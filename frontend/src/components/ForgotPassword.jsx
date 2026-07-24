function ForgotPassword({ onBackToLogin }) {
  return (
    <div className="login-page">
      <div className="login-box">

        <div className="chat-logo">🔐</div>

        <h1>Forgot Password?</h1>

        <p className="subtitle">
          Enter your email and we'll help you reset your password.
        </p>

        <form>
          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              placeholder="you@example.com"
            />
          </div>

          <button className="login-button" type="submit">
            Send Reset Link
          </button>
        </form>

        <p className="register-text">
          Remember your password?{" "}
          <span onClick={onBackToLogin}>
            Back to Sign In
          </span>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;