const dbClient = require("../utils/db");
const redisClient = require("../utils/redis");

class AppController {
  static getStatus(req, res) {
    try {
      res.status(200).json({
        redis: redisClient.isAlive(),
        db: dbClient.isAlive(),
      });
    } catch (err) {
      console.log("AppController Error: ", err);
    }
  }

  static async getStats(req, res) {
    try {
      res.status(200).json({
        users: await dbClient.nbUsers(),
        files: await dbClient.nbFiles(),
      });
    } catch (err) {
      console.log("AppController Error: ", err);
    }
  }
}
module.exports = AppController;
