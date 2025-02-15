import { createClient, RedisClientType } from "redis";

class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

    this.client.on("error", (err) => console.error("Redis error:", err));

    this.redisConnect();
  }

  // Connect to Redis
  private async redisConnect(): Promise<void> {
    try {
      await this.client.connect();
      console.log("Redis connected");
    } catch (error) {
      console.error("Redis connection failed:", error);
    }
  }

  // Set data in Redis with optional expiration
  async set<T>(
    key: string,
    value: T,
    expirationInSeconds?: number,
  ): Promise<void> {
    const data = JSON.stringify(value);
    if (expirationInSeconds) {
      await this.client.set(key, data, { EX: expirationInSeconds });
    } else {
      await this.client.set(key, data);
    }
  }

  // Get data from Redis
  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  // Delete key from Redis
  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Check if a key exists
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) > 0;
  }
}

// Export a singleton instance
const redisService = new RedisService();
export default redisService;
