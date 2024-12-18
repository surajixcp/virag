// const jwt = require("jsonwebtoken");
// const controller = require("../../controllers/message.controller")
// let users = [];

// const authSocket = (socket, next) => {
//   let token = socket.handshake.auth.token;
//   if (token) {
//     try {
//       const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//       socket.decoded = decoded;
//       next();
//     } catch (err) {
//       next(new Error("Authentication error"));
//     }
//   } else {
//     next(new Error("Authentication error"));
//   }
// };


// const socketServer = (io, socket) => {
//   const userId = socket.decoded.aud;
//   users.push({ userId, socketId: socket.id });
//   socket.on("send-message", async (payload) => {
//     await controller.Sendmessage(payload.content, payload.fromUserId, payload.toUserId);
//     const recipient = users.find((user) => user.userId === payload.toUserId);
//     if (recipient) {
//       io.to(recipient.socketId).emit("receive-message", {
//         fromUserId: userId,
//         content: payload.content,
//       });
//     }
//   });

//   socket.on("disconnect", () => {
//     users = users.filter((user) => user.userId !== userId);
//   });
// };

// module.exports = { socketServer, authSocket };

// const { Server, Socket } = require("socket.io");
// const { sub, pub, store } = require("./redis-config");
// const { Message } = require("../../models/message.model"); // Message model
// const { Conversation } = require("../../models/conversation.model"); // Conversation model

// const REDIS_CHAT_CHANNEL = "CHAT_MESSAGE";
// const setupSocket = (io) => {
//   io.on("connection", (socket) => {
//     console.log(`Socket connected: ${socket.id}`);

//     // Handle user connection
//     socket.on("user_connected", async (userId) => {
//       try {
//         await store.set(`user:${userId}`, socket.id); // Use prefixed keys for better organization
//         console.log(`User connected: ${userId}`);
//       } catch (error) {
//         console.error("Error storing user in Redis:", error);
//       }
//     });

//     // Handle private message
//     socket.on("private_message", async (data) => {
//       const { sender, receiver, content } = data; // Extract fields from the data object
//       try {
//         // Save message to database (uncomment when model is available)
//         // const message = new Message(data);
//         // await message.save();
//         // Publish message to Redis
//         await pub.publish(REDIS_CHAT_CHANNEL, JSON.stringify(data));
//       } catch (error) {
//         console.error("Error processing private message:", error);
//       }
//     });

//     // Handle disconnect
//     socket.on("disconnect", async () => {
//       try {
//         const keys = await store.keys("user:*"); // Use prefixed keys for better performance
//         for (const key of keys) {
//           const value = await store.get(key);
//           if (value === socket.id) {
//             await store.del(key); // Remove Redis key if it matches the disconnected socket
//             console.log(`User disconnected: ${key.replace("user:", "")}`);
//           }
//         }
//       } catch (error) {
//         console.error("Error handling disconnect:", error);
//       }
//     });
//   });

//   // Subscribe to Redis channel
//   sub.subscribe(REDIS_CHAT_CHANNEL);

//   // Handle messages from Redis
//   sub.on("message", async (channel, message) => {
//     if (channel === REDIS_CHAT_CHANNEL) {
//       try {
//         const parsedMessage = JSON.parse(message);
//         const receiverSocketID = await store.get(`user:${parsedMessage.receiver}`);

//         if (receiverSocketID) {
//           io.to(receiverSocketID).emit("new_message", parsedMessage);
//         }
//       } catch (error) {
//         console.error("Error handling Redis message:", error);
//       }
//     }
//   });
// };

// module.exports = { setupSocket };


// new code 
const { Server, Socket } = require("socket.io");
const { sub, pub, store } = require("./redis-config");
const Message = require("../../models/message.model"); // Import the Message model
const Conversation = require("../../models/conversation.model"); // Import the Conversation model

const REDIS_CHAT_CHANNEL = "CHAT_MESSAGE";

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle user connection
    socket.on("user_connected", async (userId) => {
      try {
        await store.set(`user:${userId}`, socket.id); // Map userId to socket.id in Redis
        console.log(`User connected: ${userId}`);
      } catch (error) {
        console.error("Error storing user in Redis:", error);
      }
    });

    // Handle private message
    socket.on("private_message", async (data) => {
      const { fromUserId, toUserId, content, fileName, filePath } = data;

      try {
        // Ensure a conversation exists
        let conversation = await Conversation.findOne({
          recipients: { $all: [fromUserId, toUserId] },
        });

        if (!conversation) {
          conversation = new Conversation({
            recipients: [fromUserId, toUserId],
          });
          await conversation.save();
        }

        // Save the message to the database
        const message = new Message({
          conversation: conversation._id,
          fromUserId,
          toUserId,
          content,
          fileName,
          filePath,
        });
        const savedMessage = await message.save();

        // Publish the message to Redis
        const messageData = {
          conversation: conversation._id,
          fromUserId,
          toUserId,
          content,
          fileName,
          filePath,
          is_read: savedMessage.is_read,
          created_at: savedMessage.created_at,
        };
        await pub.publish(REDIS_CHAT_CHANNEL, JSON.stringify(messageData));

        console.log("Message saved and published successfully.");
      } catch (error) {
        console.error("Error processing private message:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      try {
        const keys = await store.keys("user:*");
        for (const key of keys) {
          const value = await store.get(key);
          if (value === socket.id) {
            await store.del(key); // Remove the Redis key for the disconnected socket
            console.log(`User disconnected: ${key.replace("user:", "")}`);
          }
        }
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  // Subscribe to the Redis channel for real-time updates
  sub.subscribe(REDIS_CHAT_CHANNEL);

  // Listen for messages from Redis and forward them to the recipient
  sub.on("message", async (channel, message) => {
    if (channel === REDIS_CHAT_CHANNEL) {
      try {
        const parsedMessage = JSON.parse(message);

        // Get the receiver's socket ID from Redis
        const receiverSocketID = await store.get(`user:${parsedMessage.toUserId}`);

        if (receiverSocketID) {
          io.to(receiverSocketID).emit("new_message", parsedMessage); // Emit to the receiver
          console.log(`Message sent to user: ${parsedMessage.toUserId}`);
        }
      } catch (error) {
        console.error("Error handling Redis message:", error);
      }
    }
  });
};

module.exports = { setupSocket };
