const { Redis } = require("ioredis");
const redisUrl = "redis://default:cX1XHIi7drtGFFPZHQIeBaCIsgKEWiwk@redis-11539.crce280.asia-south1-1.gcp.cloud.redislabs.com:11539";

const client = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    console.log(`Retry attempt: ${times}`);
    if (times >= 3) return null; // stop retrying
    return 1000;
  }
});

client.on('error', (err) => {
  console.error("Redis Error:", err);
});

client.on('connect', () => {
  console.log("Connected to Redis!");
  client.quit();
});
