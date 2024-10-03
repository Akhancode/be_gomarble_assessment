const initializeRedisClient = require("./redis");

async function getCacheFromRedis(req, res, next) {
  return new Promise(async (resolve, reject) => {
    try {
      const redisClient = await initializeRedisClient();
      const cacheKey = req.originalUrl; // this use the url as a cache key
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('\x1b[33m%s\x1b[0m', "getting from redis");
        resolve(JSON.parse(cachedData)); // return cached data
      } else {
        resolve(null);
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function setCacheData(key, data, expirationTime = 3600) {
  const redisClient = await initializeRedisClient();

  await redisClient.set(key, JSON.stringify(data), "EX", expirationTime); // Cache for 1 hour by default
}
module.exports = { getCacheFromRedis, setCacheData };
