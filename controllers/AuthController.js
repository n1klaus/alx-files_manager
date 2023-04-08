const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const authString = authHeader.substring('Basic '.length);
    const credentials = Buffer.from(authString, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    const user = await dbClient.getUserByEmailAndPassword(email, password);
    if (user) {
      const { _id: id } = user;
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, id.toString(), 86400);
      return res.status(200).json({ token });
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(key);
    return res.status(204).send();
  }
}

module.exports = AuthController;
