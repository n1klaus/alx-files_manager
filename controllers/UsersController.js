const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const existingUser = await dbClient.getUser(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const hashedPass = sha1(password);
    const newUser = {
      email,
      password: hashedPass,
      _id: uuidv4(),
    };
    await dbClient.insertOneUser(newUser);
    return res.status(201).json({ id: newUser._id, email: newUser.email });
  }
}

module.exports = UsersController;
