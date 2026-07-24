# ChatFlow – Real-Time Chat Application

## Complete Project Documentation

ChatFlow is a full-stack real-time private messaging web application that allows users to create accounts, log in securely, add other registered users as contacts, and communicate with them in real time.

The application uses React for the frontend, Node.js and Express.js for the backend, MongoDB Atlas for database storage, and Socket.IO for real-time communication.

The project is deployed using Vercel for the frontend and Render for the backend, while MongoDB Atlas provides the cloud database.

## Tech Stack

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
- JWT (JSON Web Tokens)
- bcrypt.js
- Mongoose

### Database
- MongoDB Atlas

### Deployment
- Vercel – Frontend
- Render – Backend
- MongoDB Atlas – Cloud Database
- GitHub – Source Code and Version Control

---

# System Architecture

ChatFlow follows a full-stack client-server architecture.

The application is divided into three main parts:

1. Frontend
2. Backend
3. Database

The frontend communicates with the backend using HTTP requests for operations such as registration, login, loading users, adding contacts, and retrieving previous messages.

Socket.IO is used alongside HTTP to provide real-time communication between connected users.

The backend communicates with MongoDB Atlas using Mongoose.

## Architecture Flow

User
↓
React + Vite Frontend
↓
HTTP Requests / Socket.IO
↓
Node.js + Express.js Backend
↓
Mongoose
↓
MongoDB Atlas

## Deployed Architecture

User Browser
↓
Vercel
↓
React Frontend
↓
HTTPS + Socket.IO
↓
Render
↓
Node.js + Express.js Backend
↓
Mongoose
↓
MongoDB Atlas

---

# Frontend

The frontend of ChatFlow is built using React.js and Vite.

## React.js

React is used to create the user interface of the application.

Instead of loading a completely new HTML page every time the user performs an action, React updates only the required components.

The application contains components such as:

- Login
- Register
- Forgot Password
- Chat

React state is used to store information such as:

- Logged-in user
- Contacts
- Selected chat user
- Messages
- Current message input
- Search input
- Add User popup state

For example:

```javascript
const [messages, setMessages] = useState([]);
const [selectedUser, setSelectedUser] = useState(null);
const [message, setMessage] = useState("");

---

# User Registration Process

When a new user creates an account, the following process happens:

1. The user enters a username, email, password, and password confirmation in the React frontend.
2. React sends a POST request to the backend.

```text
POST /api/auth/register
```

The request contains:

```json
{
  "username": "example",
  "email": "example@gmail.com",
  "password": "password123"
}
```

3. Express receives the request.
4. The backend checks whether all required fields are present.
5. It checks whether the password has at least 6 characters.
6. MongoDB is checked to determine whether the email is already registered.
7. The password is hashed using bcrypt.
8. A new User document is created using Mongoose.
9. The user is saved in MongoDB Atlas.
10. The backend returns a success response to the frontend.

## Why bcrypt is Used

Passwords should never be stored as plain text.

ChatFlow uses bcrypt.js to hash passwords before storing them.

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

The database therefore stores a hash instead of the original password.

This improves account security because the original password cannot simply be read from the database.

---

# Login and Authentication Process

When a user signs in:

1. The user enters their email and password.
2. React sends the credentials to:

```text
POST /api/auth/login
```

3. The backend searches MongoDB for the email.
4. If the account exists, bcrypt compares the entered password with the stored password hash.

```javascript
const isPasswordCorrect = await bcrypt.compare(
  password,
  user.password
);
```

5. If the credentials are valid, the backend creates a JSON Web Token (JWT).

```javascript
const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
```

6. The backend sends the token and basic user information to the frontend.
7. The frontend stores the login information in localStorage.

```javascript
localStorage.setItem("token", data.token);
localStorage.setItem(
  "user",
  JSON.stringify(data.user)
);
```

The user is then taken to the ChatFlow chat interface.

## Why JWT is Used

JWT provides a way to represent an authenticated user after login.

Instead of sending the user's password repeatedly, the server generates a signed token.

In a more advanced version of ChatFlow, protected API routes can verify this token before allowing access to private resources.

---

# Adding Users and Contacts

ChatFlow allows users to add other registered users as contacts.

The frontend first requests registered users using:

```text
GET /api/users
```

The logged-in user is removed from the displayed list.

When the user clicks **Add**, React sends:

```text
POST /api/users/:userId/contacts
```

with the selected user's ID.

Example:

```json
{
  "contactId": "USER_ID"
}
```

The backend:

1. Finds the current user.
2. Finds the selected contact.
3. Prevents users from adding themselves.
4. Checks whether the contact has already been added.
5. Adds the contact's MongoDB ObjectId to the user's contacts array.
6. Saves the updated user document.

The User model uses a reference to another User:

```javascript
contacts: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
]
```

Mongoose `populate()` is used when retrieving contacts so that ChatFlow can display information such as username and email.

---

# Real-Time Messaging with Socket.IO

Normal HTTP requests work well for operations such as login and retrieving data.

However, real-time chat requires the server to send information to another browser immediately without waiting for that browser to make another HTTP request.

ChatFlow uses Socket.IO for this purpose.

## Socket Connection

The React frontend connects to the Socket.IO server:

```javascript
const socket = io(API_URL);
```

After login, the frontend tells the backend which user owns the socket:

```javascript
socket.emit("register_user", user.id);
```

The backend stores connected users in a Map:

```javascript
const onlineUsers = new Map();
```

Conceptually, the Map contains:

```text
User ID → Socket ID
```

This allows the backend to determine which Socket.IO connection belongs to a particular logged-in user.

---

# Sending a Private Message

Suppose User A sends a message to User B.

The frontend creates message data containing:

```javascript
{
  senderId,
  receiverId,
  senderUsername,
  message,
  time
}
```

It then sends the event:

```javascript
socket.emit("private_message", messageData);
```

The backend receives the Socket.IO event.

It determines the receiver's socket using:

```javascript
const receiverSocketId = onlineUsers.get(receiverId);
```

If the receiver is currently online, the backend sends the message directly to that user's socket:

```javascript
io.to(receiverSocketId).emit(
  "receive_private_message",
  messageData
);
```

The receiving React application listens for:

```javascript
socket.on(
  "receive_private_message",
  receiveMessage
);
```

React then updates the messages state, causing the new message to appear on the screen.

This happens without refreshing the webpage.

---

# Message Storage and Chat History

Real-time delivery alone is not enough.

If messages existed only in React state or Socket.IO, they would disappear after refreshing or closing the browser.

Therefore ChatFlow also uses MongoDB to provide persistent message storage.

Messages contain information such as:

```text
sender
receiver
message
createdAt
updatedAt
```

When a conversation is opened, the frontend requests previous messages using:

```text
GET /api/messages/:userId/:otherUserId
```

The backend searches for messages where:

```text
User A → User B
```

or:

```text
User B → User A
```

and sorts them by creation time.

The frontend converts the MongoDB message data into the format required by the chat interface and displays the conversation.

---

# Complete Message Flow

The overall messaging process can be represented as:

```text
User A types "Hello"
        ↓
React Chat Component
        ↓
socket.emit("private_message")
        ↓
Socket.IO Server on Render
        ↓
Find User B's Socket ID
        ↓
receive_private_message
        ↓
User B's React Application
        ↓
React updates messages state
        ↓
"Hello" appears immediately
```

For persistent chat history:

```text
Message
   ↓
Node.js / Express Backend
   ↓
Mongoose Message Model
   ↓
MongoDB Atlas
   ↓
Stored permanently
   ↓
GET /api/messages/...
   ↓
Previous conversation loaded
```

---

# Frontend and Backend Communication

ChatFlow uses two main communication methods.

## HTTP / REST API

Used for:

- Registering users
- Logging in
- Retrieving registered users
- Adding contacts
- Loading contacts
- Retrieving previous messages

Example:

```javascript
fetch(`${API_URL}/api/auth/login`);
```

## Socket.IO

Used for:

- Establishing real-time connections
- Registering connected users
- Sending private messages
- Receiving private messages immediately

Using both technologies allows ChatFlow to combine persistent database operations with real-time communication.

---

# Database Models

ChatFlow currently uses two main MongoDB models.

## User Model

The User model stores information about registered users.

Important fields include:

```text
username
email
password
contacts
createdAt
updatedAt
```

The `contacts` field contains MongoDB ObjectIds referencing other users.

Example structure:

```javascript
{
  username: String,
  email: String,
  password: String,
  contacts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
}
```

The password stored in MongoDB is a bcrypt hash rather than the user's original password.

---

## Message Model

The Message model is responsible for storing conversations between users.

Important fields include:

```text
sender
receiver
message
createdAt
updatedAt
```

The sender and receiver identify which users participated in the message.

Because messages are stored in MongoDB, previous conversations can be retrieved even after users close or refresh the application.

---

# API Endpoints

The Express backend provides the following main API endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive a JWT |
| GET | `/api/users` | Retrieve registered users |
| GET | `/api/users/:userId/contacts` | Retrieve a user's contacts |
| POST | `/api/users/:userId/contacts` | Add another user as a contact |
| GET | `/api/messages/:userId/:otherUserId` | Retrieve conversation history |

Socket.IO is used separately for real-time message delivery.

Important Socket.IO events include:

| Event | Purpose |
|---|---|
| `register_user` | Connect a logged-in user ID with a socket |
| `private_message` | Send a private message |
| `receive_private_message` | Deliver a message to a connected user |

---

# Project Folder Structure

The project is divided into separate frontend and backend applications.

```text
realtime-chat-app/
│
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Message.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   │
│   ├── src/
│   │   ├── assets/
│   │   │
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── .gitignore
├── PROJECT_DOCUMENTATION.md
└── README.md
```

The `.env` files are excluded from Git using `.gitignore` because they may contain credentials and secret values.

---

# Environment Variables

## Backend

The backend uses environment variables similar to:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=your_frontend_url
```

`MONGO_URI` contains the MongoDB Atlas connection string.

`JWT_SECRET` is used when signing JSON Web Tokens.

`CLIENT_URL` identifies the frontend application that is allowed to communicate with the backend through CORS.

Sensitive values should never be committed to GitHub.

## Frontend

The frontend uses:

```env
VITE_API_URL=your_backend_url
```

For local development this can point to:

```text
http://localhost:5001
```

In production it points to the deployed Render backend.

---

# Deployment

ChatFlow uses three cloud services.

## Vercel

Vercel hosts the React/Vite frontend.

When a user visits the deployed ChatFlow website, Vercel delivers the frontend application to the browser.

## Render

Render hosts the Node.js, Express.js, and Socket.IO backend.

The Render server handles:

- API requests
- Authentication logic
- Database communication
- Socket.IO connections
- Real-time messaging

## MongoDB Atlas

MongoDB Atlas provides the cloud database.

It stores:

- User accounts
- Password hashes
- Contacts
- Messages
- Timestamps

The database is independent of the user's device, allowing application data to remain available across sessions and devices.

---

# Production Architecture

```text
                   USER
                     │
                     ▼
             Browser / Device
                     │
                     ▼
              Vercel Frontend
              React + Vite
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
      REST API               Socket.IO
          │                     │
          └──────────┬──────────┘
                     │
                     ▼
               Render Backend
             Node.js + Express
                  Socket.IO
                     │
                     ▼
                  Mongoose
                     │
                     ▼
               MongoDB Atlas
                     │
              ┌──────┴──────┐
              ▼             ▼
            Users        Messages
```

---

# Running ChatFlow Locally

## 1. Clone the Repository

```bash
git clone <repository-url>
```

Move into the project:

```bash
cd realtime-chat-app
```

## 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Create a `.env` file inside `backend` and configure the required environment variables.

Start the backend:

```bash
node server.js
```

The backend normally runs at:

```text
http://localhost:5001
```

## 3. Install Frontend Dependencies

Open another terminal and run:

```bash
cd frontend
npm install
```

Create the frontend `.env` file:

```env
VITE_API_URL=http://localhost:5001
```

Start the React application:

```bash
npm run dev
```

Vite normally provides the frontend at:

```text
http://localhost:5173
```

---

# Security Features

ChatFlow currently includes several basic security practices:

- Passwords are hashed using bcrypt.js.
- Plain-text passwords are not stored in MongoDB.
- JWT tokens are generated after successful login.
- Sensitive environment variables are excluded from GitHub.
- MongoDB credentials are stored using environment variables.
- CORS controls which frontend origin can communicate with the backend.

For a production-grade application, additional security measures would be required.

---

# Future Improvements

ChatFlow can be extended with features such as:

- JWT middleware for protecting private API routes
- Delete messages
- Edit messages
- Read receipts
- Delivered and seen indicators
- Online/offline status
- Typing indicators
- Profile pictures
- Group chats
- Image and file sharing
- Emoji support
- Message search
- Password reset using email
- Refresh tokens or secure cookie-based authentication
- Mobile responsive improvements
- Push notifications
- Message pagination
- Better error handling and validation

---

# What This Project Demonstrates

ChatFlow demonstrates practical knowledge of full-stack web development.

The project includes experience with:

- Building React components
- React state management
- Creating REST APIs
- Node.js backend development
- Express.js routing
- MongoDB database operations
- Mongoose schemas and models
- Password hashing
- JWT generation
- Real-time communication using Socket.IO
- Environment variables
- Git and GitHub
- Frontend deployment using Vercel
- Backend deployment using Render
- Cloud database management using MongoDB Atlas

Most importantly, the project demonstrates how a frontend, backend, database, and real-time communication system work together to create a complete full-stack web application.

---

# Conclusion

ChatFlow is a full-stack real-time messaging application built to understand and implement modern web development concepts.

The frontend provides the user interface, the Express backend handles application logic and APIs, MongoDB Atlas provides persistent cloud storage, and Socket.IO enables real-time communication between connected users.

The project combines these technologies into a deployed application where users can register, log in, add contacts, access previous conversations, and communicate in real time.