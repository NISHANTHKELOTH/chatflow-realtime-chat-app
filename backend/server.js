const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

const User = require("./models/User");
const Message = require("./models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);

// ==============================
// ALLOWED FRONTEND URLS
// ==============================

const allowedOrigins = [
  "http://localhost:5173",
  "https://chatflow-realtime-chat-app.vercel.app",
];

// ==============================
// SOCKET.IO SETUP
// ==============================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ==============================
// EXPRESS CORS
// ==============================

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// ==============================
// MONGODB CONNECTION
// ==============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.log(
      "MongoDB connection error:",
      error.message
    );
  });

// ==============================
// TEST ROUTE
// ==============================

app.get("/", (req, res) => {
  res.send("Chat App Backend is Running");
});

// ==============================
// REGISTER
// ==============================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully",
    });
  } catch (error) {
    console.log("Registration error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==============================
// LOGIN
// ==============================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.log("Login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==============================
// GET ALL USERS
// ==============================

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select(
      "_id username email"
    );

    res.status(200).json(users);
  } catch (error) {
    console.log("Get users error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==============================
// GET CONTACTS
// ==============================

app.get(
  "/api/users/:userId/contacts",
  async (req, res) => {
    try {
      const user = await User.findById(
        req.params.userId
      ).populate(
        "contacts",
        "_id username email"
      );

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      res.status(200).json(user.contacts);
    } catch (error) {
      console.log(
        "Get contacts error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// ==============================
// ADD CONTACT
// ==============================

app.post(
  "/api/users/:userId/contacts",
  async (req, res) => {
    try {
      const { contactId } = req.body;

      if (req.params.userId === contactId) {
        return res.status(400).json({
          message: "You cannot add yourself",
        });
      }

      const user = await User.findById(
        req.params.userId
      );

      const contact = await User.findById(
        contactId
      );

      if (!user || !contact) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const alreadyAdded = user.contacts.some(
        (id) => id.toString() === contactId
      );

      if (alreadyAdded) {
        return res.status(400).json({
          message: "User already added",
        });
      }

      user.contacts.push(contactId);

      await user.save();

      res.status(200).json({
        message: "User added successfully",

        contact: {
          _id: contact._id,
          username: contact.username,
          email: contact.email,
        },
      });
    } catch (error) {
      console.log(
        "Add contact error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// ==============================
// GET CONVERSATION MESSAGES
// ==============================

app.get(
  "/api/messages/:userId/:otherUserId",
  async (req, res) => {
    try {
      const {
        userId,
        otherUserId,
      } = req.params;

      const messages = await Message.find({
        $or: [
          {
            sender: userId,
            receiver: otherUserId,
          },
          {
            sender: otherUserId,
            receiver: userId,
          },
        ],
      }).sort({
        createdAt: 1,
      });

      res.status(200).json(messages);
    } catch (error) {
      console.log(
        "Get messages error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// ==============================
// ONLINE USERS
// ==============================

const onlineUsers = new Map();

// ==============================
// SOCKET.IO
// ==============================

io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.id
  );

  // ------------------------------
  // REGISTER CONNECTED USER
  // ------------------------------

  socket.on(
    "register_user",
    (userId) => {
      onlineUsers.set(
        userId.toString(),
        socket.id
      );

      console.log(
        "Registered user:",
        userId
      );
    }
  );

  // ------------------------------
  // PRIVATE MESSAGE
  // ------------------------------

  socket.on(
    "private_message",
    async (data) => {
      try {
        const {
          senderId,
          receiverId,
          senderUsername,
          message,
        } = data;

        if (
          !senderId ||
          !receiverId ||
          !message?.trim()
        ) {
          return;
        }

        // SAVE MESSAGE TO MONGODB

        const savedMessage =
          await Message.create({
            sender: senderId,
            receiver: receiverId,
            message: message.trim(),
          });

        // Message sent to frontend

        const messageData = {
          _id: savedMessage._id.toString(),

          senderId:
            savedMessage.sender.toString(),

          receiverId:
            savedMessage.receiver.toString(),

          senderUsername,

          message:
            savedMessage.message,

          time:
            savedMessage.createdAt,
        };

        // Send confirmation/message
        // back to sender

        socket.emit(
          "receive_private_message",
          messageData
        );

        // Find receiver

        const receiverSocketId =
          onlineUsers.get(
            receiverId.toString()
          );

        // Send only to receiver

        if (receiverSocketId) {
          io.to(
            receiverSocketId
          ).emit(
            "receive_private_message",
            messageData
          );
        }

        console.log(
          "Message saved:",
          messageData
        );
      } catch (error) {
        console.log(
          "Private message error:",
          error.message
        );
      }
    }
  );

  // ------------------------------
  // DISCONNECT
  // ------------------------------

  socket.on("disconnect", () => {
    for (
      const [
        userId,
        socketId,
      ] of onlineUsers.entries()
    ) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    console.log(
      "User disconnected:",
      socket.id
    );
  });
});

// ==============================
// START SERVER
// ==============================

const PORT =
  process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});