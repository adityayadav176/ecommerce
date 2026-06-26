import Redis from "ioredis";

const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
           maxRetriesPerRequest: null,
          enableReadyCheck: true,
      })
    : new Redis({
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
      });

redis.on("connect", () => {
    console.log("Redis Connected");
});

redis.on("error", (err) => {
    console.error("Redis Error:", err);
});

export {
    redis
};