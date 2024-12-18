const { Redis } = require("ioredis");
let REDIS_HOST = "localhost";
let REDIS_PORT = 6379;

const store = new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT)
});

const pub = new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT)
});

const sub = new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT)
});

store.on('connect', () => console.log('Redis connected'));
store.on('error', (error) => console.error('Redis connection error:', error));

module.exports = { store, pub, sub };