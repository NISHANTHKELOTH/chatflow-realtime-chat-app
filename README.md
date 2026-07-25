# 💬 ChatFlow – Real-Time Chat Application

ChatFlow is a full-stack real-time private messaging web application where users can create accounts, log in, add registered users as contacts, and communicate instantly.

The application uses **React** for the frontend, **Node.js + Express.js** for the backend, **MongoDB Atlas** for persistent data storage, and **Socket.IO** for real-time messaging.

## 🌐 Live Demo

**ChatFlow:** 

🚀 https://chatflow-realtime-chat-app-git-main-nishanth-projects.vercel.app

> The backend is hosted on Render's free tier, so the first request after a period of inactivity may take some time while the server wakes up.

---

## ✨ Features

- User registration
- User login
- Secure password hashing using bcrypt
- JWT generation after authentication
- Add registered users as contacts
- Search users by username or email
- Private one-to-one conversations
- Real-time messaging using Socket.IO
- Persistent message storage
- Previous chat history
- MongoDB cloud database
- Responsive chat interface
- Cloud deployment

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Vite
- JavaScript
- HTML
- CSS
- Socket.IO Client

### Backend

- Node.js
- Express.js
- Socket.IO
- JSON Web Token (JWT)
- bcrypt.js
- Mongoose

### Database

- MongoDB Atlas

### Deployment

- **Vercel** – Frontend
- **Render** – Backend
- **MongoDB Atlas** – Database
- **GitHub** – Version control and source code

---

## 🏗️ Architecture

```text
                  User
                    │
                    ▼
             React + Vite
                Frontend
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       REST API            Socket.IO
          │                   │
          └─────────┬─────────┘
                    ▼
            Node.js + Express
                 Backend
                    │
                 Mongoose
                    │
                    ▼
              MongoDB Atlas
             ┌──────┴──────┐
             ▼             ▼
           Users        Messages
```

---

## 🔄 How ChatFlow Works

### Authentication

The user registers through the React frontend.

The frontend sends the account information to the Express backend.

The backend hashes the password using bcrypt before storing the account in MongoDB.

During login, the entered password is compared with the stored hash. After successful authentication, the backend generates a JWT.

### Real-Time Messaging

After login, the frontend establishes a Socket.IO connection with the backend.

Each connected user is associated with their Socket.IO connection.

When User A sends a message to User B:

```text
User A
  ↓
React
  ↓
Socket.IO
  ↓
Node.js Server
  ↓
Socket.IO
  ↓
User B
```

The message is also stored in MongoDB so previous conversations can be retrieved later.

---

## 📂 Project Structure

```text
realtime-chat-app/
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
│
├── PROJECT_DOCUMENTATION.md
├── README.md
└── .gitignore
```

---

## 🔌 Main API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/users` | Get registered users |
| GET | `/api/users/:userId/contacts` | Get contacts |
| POST | `/api/users/:userId/contacts` | Add a contact |
| GET | `/api/messages/:userId/:otherUserId` | Load conversation |

---

## ⚡ Socket.IO Events

| Event | Purpose |
|---|---|
| `register_user` | Associates a user with their socket |
| `private_message` | Sends a private message |
| `receive_private_message` | Receives a real-time message |

---

## 💻 Running Locally

Clone the repository:

```bash
git clone https://github.com/NISHANTHKELOTH/chatflow-realtime-chat-app.git
cd chatflow-realtime-chat-app
```

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
node server.js
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001
```

Start the frontend:

```bash
npm run dev
```

---

## 🔐 Security

ChatFlow uses:

- bcrypt password hashing
- JWT generation
- Environment variables for secrets
- CORS configuration
- MongoDB credentials stored outside source code

`.env` files are excluded from GitHub using `.gitignore`.

---

## 📖 Complete Documentation

For a detailed explanation of the frontend, backend, database, authentication process, Socket.IO communication, APIs, deployment architecture, and application flow, see:

**[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)**

---

## 🚀 Future Improvements

- JWT-protected API routes
- Online/offline status
- Typing indicators
- Read receipts
- Profile pictures
- Group chats
- Image and file sharing
- Emoji support
- Password reset through email
- Push notifications
- Message deletion and editing

---

## 👨‍💻 Author

**Keloth Nishanth**

Built as a full-stack web development project to learn and demonstrate React, Node.js, Express.js, MongoDB, authentication, REST APIs, Socket.IO, Git/GitHub, and cloud deployment.
