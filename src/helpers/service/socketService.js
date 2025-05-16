const { Server } = require("socket.io");
const { sub, pub, store } = require("./redis-config");
const Message = require("../../models/message.model"); // Import the Message model
const Conversation = require("../../models/conversation.model"); // Import the Conversation model
const storyController = require("../../controllers/story.controller");
const cron = require('node-cron');
const REDIS_CHAT_CHANNEL = "CHAT_MESSAGE";

// setInterval(async () => {
//   try {
//       // Example user IDs for testing the interval
//       const fromUserId = '676aec066f379376644ad72d';
//       const toUserId = '676aec106f379376644ad733';

//       console.log('Interval triggered every 10 seconds!');
//       await storyController.storeUserId(fromUserId, toUserId);
//   } catch (error) {
//       console.error("Error in interval:", error);
//   }
// }, 10000);

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
        await storyController.storeUserId(fromUserId, toUserId)
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
        console.log("Received message:", parsedMessage);

        // Get the receiver's socket ID from Redis
        const receiverSocketID = await store.get(`user:${parsedMessage.toUserId}`);
        console.log("Receiver's socket ID:", receiverSocketID);

        if (receiverSocketID) {
          // Emit the message to the receiver's socket
          io.to(receiverSocketID).emit("new_message", parsedMessage);
          console.log(`Message sent to user: ${parsedMessage.toUserId}`);
        } else {
          console.log(`No socket ID found for user: ${parsedMessage.toUserId}`);
        }
      } catch (error) {
        console.error("Error handling Redis message:", error);
      }
    }
  });

};

module.exports = { setupSocket };

// const { Server } = require("socket.io");
// const { sub, pub, store } = require("./redis-config");
// const Message = require("../../models/message.model");

// const REDIS_CHAT_CHANNEL = 'CHAT_MESSAGE';

// const setupSocket = (io) => {

//     io.on('connection', (socket) => {

//         // Handle user connection
//         socket.on('user_connected', async (userId) => {
//             try {
//                 await store.set(userId, socket.id);
//                 console.log(`User connected: ${userId}`);
//             } catch (error) {
//                 console.error('Error storing user in Redis:', error);
//             }
//         });

//         // Handle private message
//         socket.on('private_message', async (data) => {
//             const { sender, receiver, content } = data;

//             try {
//                 // Save the message to the database
//                 const message = new Message({ sender, receiver, content });
//                 await message.save();

//                 // Publish the message to Redis
//                 pub.publish(REDIS_CHAT_CHANNEL, JSON.stringify(data));
//                 console.log('Message saved and published successfully.');
//             } catch (error) {
//                 console.error('Error saving message:', error);
//             }
//         });

//         // Handle user disconnection
//         socket.on('disconnect', async () => {
//             try {
//                 const keys = await store.keys("*"); // Get all Redis keys
//                 for (const key of keys) {
//                     const value = await store.get(key);
//                     if (value === socket.id) {
//                         await store.del(key); // Remove key if it matches the socket ID
//                         console.log(`User disconnected: ${key}`);
//                     }
//                 }
//             } catch (error) {
//                 console.error('Error handling disconnection:', error);
//             }
//         });
//     });

//     // Subscribe to the Redis chat channel
//     sub.subscribe(REDIS_CHAT_CHANNEL);

//     // Listen for Redis messages and emit them to the recipient's socket
//     sub.on('message', async (channel, message) => {
//         if (channel === REDIS_CHAT_CHANNEL) {
//             try {
//                 const parsedMessage = JSON.parse(message);
//                 const { receiver } = parsedMessage;

//                 const receiverSocketID = await store.get(receiver);

//                 if (receiverSocketID) {
//                     io.to(receiverSocketID).emit('new_message', parsedMessage);
//                     console.log(`Message sent to user: ${receiver}`);
//                 } else {
//                     console.log(`Receiver not connected: ${receiver}`);
//                 }
//             } catch (error) {
//                 console.error('Error handling Redis message:', error);
//             }
//         }
//     });
// };

// module.exports = { setupSocket };
