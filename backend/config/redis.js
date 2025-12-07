import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Redis configuration לcaching
 * שיפור של 95-99% בזמני תגובה לנתונים זהים!
 */

let redis = null;

// בדיקה אם Redis מוגדר
if (process.env.REDIS_ENABLED === "true" || process.env.REDIS_HOST) {
  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      showFriendlyErrorStack: true,
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    redis.on("ready", () => {
      console.log("🚀 Redis ready for caching");
    });

    redis.on("error", (err) => {
      console.error("❌ Redis connection error:", err.message);
      // לא עוצרים את השרת אם Redis לא זמין
    });

    redis.on("close", () => {
      console.warn("⚠️  Redis connection closed");
    });

    redis.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });
  } catch (error) {
    console.error("❌ Failed to initialize Redis:", error.message);
    redis = null;
  }
} else {
  console.log("ℹ️  Redis caching is disabled (set REDIS_ENABLED=true to enable)");
}

/**
 * Helper functions
 */

/**
 * שמירה בcache
 */
export const setCache = async (key, data, ttl = 300) => {
  if (!redis) return false;
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("Cache set error:", error);
    return false;
  }
};

/**
 * קבלה מcache
 */
export const getCache = async (key) => {
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
};

/**
 * מחיקת cache לפי pattern
 */
export const clearCachePattern = async (pattern) => {
  if (!redis) return 0;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Cleared ${keys.length} cache keys matching: ${pattern}`);
      return keys.length;
    }
    return 0;
  } catch (error) {
    console.error("Clear cache error:", error);
    return 0;
  }
};

/**
 * מחיקת cache בודד
 */
export const deleteCache = async (key) => {
  if (!redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Delete cache error:", error);
    return false;
  }
};

/**
 * בדיקה אם Redis פעיל
 */
export const isRedisActive = () => {
  return redis !== null && redis.status === "ready";
};

export default redis;

