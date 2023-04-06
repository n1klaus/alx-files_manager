const sha1 = require("sha1");
const { v4: uuidv4 } = require("uuid");
const dbClient = require("../utils/db");
const redisClient = require("../utils/redis");

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }
      if (!password) {
        return res.status(400).json({ error: "Missing password" });
      }
      const existingUser = await dbClient.getUser(email);
      if (existingUser) {
        return res.status(400).json({ error: "Already exist" });
      }
      const hashedPass = sha1(password);
      const newUser = {
        email,
        password: hashedPass,
        _id: uuidv4(),
      };
      await dbClient.insertOneUser(newUser);
      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (err) {
      console.log("UserControllers Error: ", err);
    }
  }
}

class UserController {
  static async getMe(req, res) {
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
      const user = await dbClient.getUserById(userId);
      return res.status(200).json({ id: user._id, email: user.email });
    } catch (err) {
      console.log("UserController Error: ", err);
    }
  }
}

module.exports = { UsersController, UserController };
