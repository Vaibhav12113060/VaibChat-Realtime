const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const colors = require("colors");
const connectDB = require("./config/db");

// dot env configuration

dotenv.config();

// db configuration

connectDB();

// rest object

const app = express();

// Middlewares

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes

// Auth Routes
app.use("/api/v1/auth", require("./routes/authRoutes"));

// User Routes
app.use("/api/v1/user", require("./routes/userRoutes"));

// Contact Routes

app.use("/api/v1/contact", require("./routes/contactRoutes"));

// Conversation Routes

app.use("/api/v1/conver", require("./routes/conversationRoutes"));

app.use("/", (req, res) => {
  return res.status(200).send("<h1>Welcome to Chat Application</h1>");
});

// PORT

const PORT = process.env.PORT || 8000;

// listen

app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`.bgCyan);
});
