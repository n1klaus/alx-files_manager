import { createClient } from "redis";

class RedisClient {
    constructor() {
        this.client = createClient();
        this.client.on("error", (err) => {
            console.log(err);
        })
    }

    isAlive() {
        return true ? this.client?.connected : false;
    }

    async get(key) {
        if (key) {
            return Promise.resolve(await this.client.get(key, (err, value) => {
                if (err) throw err;
                return value.toString();
            }));
        }
        return null;
    }

    async set(key, val, duration) {
        if (key && val) {
            await this.client.set(key, val, (err, response) => {
                if (err) throw err;
                if (response) this.client.expire(key, duration);
            });
        }
    }

    async del(key) {
        if (key) {
            await this.client.del(key, (err, response) => {
                if (err) throw err;
                if (response !== 1) throw new Error();
            });
        }
    }
}

const redisClient = new RedisClient();

export default redisClient;
