const { v4: uuidv4 } = require("uuid");
const dbClient = require("../utils/db");
const redisClient = require("../utils/redis");

function isBase64(str) {
  if (!str) {
    return false;
  }
  try {
    return btoa(atob(str)) == str;
  } catch (err) {
    return false;
  }
}

class AuthController {
  static async getConnect(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Basic ")) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const authString = authHeader.substring("Basic ".length);
      if (!isBase64(authString)) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const credentials = Buffer.from(authString, "base64").toString("ascii");
      const [email, password] = credentials.split(":");
      const user = await dbClient.getUserByEmailAndPassword(email, password);
      if (user) {
        const { _id: id } = user;
        const token = uuidv4();
        const key = `auth_${token}`;
        await redisClient.set(key, id.toString(), 86400);
        return res.status(200).json({ token });
      }
      return res.status(401).json({ error: "Unauthorized" });
    } catch (err) {
      console.log("AuthController Connect Error: ", err);
    }
  }

  // eslint-disable-next-line consistent-return
  static async getDisconnect(req, res) {
    try {
      const token = req.headers["x-token"];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      await redisClient.del(key);
      return res.status(204).send();
    } catch (err) {
      console.log("AuthController Disconnect Error: ", err);
    }
    await redisClient.del(key);
    res.status(204).send();
  }
}

module.exports = AuthController;
