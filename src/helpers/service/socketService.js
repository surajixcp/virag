const jwt = require("jsonwebtoken");
const controller = require("../../controllers/message.controller")
let users = [];

const authSocket = (socket, next) => {
  let token = socket.handshake.auth.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.decoded = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  } else {
    next(new Error("Authentication error"));
  }
};


const socketServer = (io, socket) => {
  const userId = socket.decoded.aud;
  users.push({ userId, socketId: socket.id });
  socket.on("send-message", async (payload) => {
    await controller.Sendmessage(payload.content, payload.fromUserId, payload.toUserId);
    const recipient = users.find((user) => user.userId === payload.toUserId);
    if (recipient) {
      io.to(recipient.socketId).emit("receive-message", {
        fromUserId: userId,
        content: payload.content,
      });
    }
  });

  socket.on("disconnect", () => {
    users = users.filter((user) => user.userId !== userId);
  });
};

module.exports = { socketServer, authSocket };
