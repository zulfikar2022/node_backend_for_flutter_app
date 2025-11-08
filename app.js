require("dotenv").config();
const serverless = require("serverless-http");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const postsRouter = require("./routes/posts.js");
const commentsRouter = require("./routes/comments.js");
const likesRouter = require("./routes/likes.js");
const usersRouter = require("./routes/users.js");

const { connectDB } = require("./config/db.js");
const { initCloudinary } = require("./config/cloudinary.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init services
connectDB();
initCloudinary();

// Routes
app.use("/posts", postsRouter);
app.use("/comments", commentsRouter);
app.use("/likes", likesRouter);
app.use("/users", usersRouter);

// 404
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: { message: "Not Found" } });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  const response = {
    success: false,
    error: {
      message: err.message || "Internal Server Error",
    },
  };
  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.error.stack = err.stack;
  }
  res.status(status).json(response);
});

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports = app;
module.exports.handler = serverless(app);
