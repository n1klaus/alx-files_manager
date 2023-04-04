const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
    }
    try {
      const user = await dbClient.db.collection('users').findOne({ email });
      if (user) {
        res.status(400).json({ error: 'User already exists' });
      }
      const hashedPass = sha1(password);
      const newUser = {
        email,
        password: hashedPass,
        id: uuidv4(),
      };
      await dbClient.db.collection('users').insertOne(newUser);
      res.status(201).json({ id: newUser.id, email: newUser.email });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }
}

module.exports = UsersController;
