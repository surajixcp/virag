const { Redis } = require("ioredis");
const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;

const createRedisConfig = () => {
    if (redisUrl) {
        return new Redis(redisUrl);
    }
    return new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT || 6379),
    });
};

const store = createRedisConfig();
const pub = createRedisConfig();
const sub = createRedisConfig();

store.on('connect', () => console.log('Redis connected'));
store.on('error', (error) => console.error('Redis store connection error:', error));
pub.on('error', (error) => console.error('Redis pub connection error:', error));
sub.on('error', (error) => console.error('Redis sub connection error:', error));

module.exports = { store, pub, sub };