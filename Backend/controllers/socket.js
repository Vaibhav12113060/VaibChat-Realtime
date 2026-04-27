const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin: "*", // Allow all origins (Configure this for production)
      methods: ["GET", "POST"],
    },
  });

  // Middleware for Authentication
  io.use(async (socket, next) => {
    try {
      // Client should send token in auth object: { auth: { token: "..." } }
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to socket
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("Socket Connected:", socket.id);

    // 1. Join user's own room (for personal notifications)
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });

    // 2. Join a specific chat room
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });

    // 3. Typing Indicators
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

    // 4. New Message Handling
    socket.on("new message", (newMessageReceived) => {
      const conversationId = newMessageReceived.conversationId;

      if (!conversationId) return console.log("conversationId not defined");

      // Broadcast to everyone in the room EXCEPT the sender
      // The sender already has the message from the API response
      socket.to(conversationId).emit("message received", newMessageReceived);
    });

    // 5. Read Receipt Handling
    socket.on("read message", ({ conversationId, userId }) => {
      socket
        .to(conversationId)
        .emit("message read", { conversationId, userId });
    });

    // 6. Disconnect
    socket.on("disconnect", () => {
      console.log("USER DISCONNECTED");
      // Update last seen in DB
      if (socket.user && socket.user.id) {
        User.findByIdAndUpdate(socket.user.id, { lastSeen: Date.now() }).catch(
          (err) => console.log(err),
        );
      }
      // Leave personal room
      if (socket.user) socket.leave(socket.user.id);
    });
  });
};

module.exports = { initializeSocket };
