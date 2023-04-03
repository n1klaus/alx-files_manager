import { createClient } from 'redis';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.log('Redis error: ', err);
    });
  }

  async isAlive() {
    return new Promise((resolve) => {
      this.client.ping((err, res) => {
        if (res) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  async set(key, value, expire) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, expire, value, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }

  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
    });
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
