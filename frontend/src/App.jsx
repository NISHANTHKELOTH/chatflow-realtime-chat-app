import { useState } from "react";
import "./App.css";

import Login from "./components/login.jsx";
import Register from "./components/Register.jsx";
import ForgotPassword from "./components/ForgotPassword.jsx";
import Chat from "./components/Chat.jsx";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  if (page === "register") {
    return (
      <Register
        onLogin={() => setPage("login")}
      />
    );
  }

  if (page === "forgot") {
    return (
      <ForgotPassword
        onBackToLogin={() => setPage("login")}
      />
    );
  }

  if (page === "chat") {
    return (
      <Chat
        user={user}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          setUser(null);
          setPage("login");
        }}
      />
    );
  }

  return (
    <Login
      onRegister={() => setPage("register")}
      onForgotPassword={() => setPage("forgot")}
      onLogin={(loggedInUser) => {
        setUser(loggedInUser);
        setPage("chat");
      }}
    />
  );
}

export default App;