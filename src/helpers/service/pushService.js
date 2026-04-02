const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

/**
 * Dispatch Push Notifications to an array of Expo Push Tokens
 * @param {Array<string>} pushTokens - Array of Expo push tokens (e.g. ExponentPushToken[xxx])
 * @param {string} title - The title of the Push Notification
 * @param {string} body - The body message of the Push Notification
 * @param {Object} data - Custom JSON data payload attached to the notification
 */
const sendPushNotification = async (pushTokens, title, body, data = {}) => {
  let messages = [];
  
  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('Ticket Chunk:', ticketChunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push chunk:', error);
    }
  }
};

module.exports = { sendPushNotification };
