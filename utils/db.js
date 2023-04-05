const { MongoClient } = require('mongodb');
const sha1 = require('sha1');

class DBClient {
  constructor() {
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
    const URL = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

    this.client = new MongoClient(URL, { useUnifiedTopology: true });
    this.isConnected = false;

    this.client.connect((err) => {
      if (err) {
        console.log('MongoDB error: ', err);
      } else {
        this.isConnected = true;
      }
    });
  }

  isAlive() {
    return this.isConnected;
  }

  async nbUsers() {
    try {
      const res = await this.client.db().collection('users').countDocuments();
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async nbFiles() {
    try {
      const res = await this.client.db().collection('files').countDocuments();
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async getUser(email) {
    try {
      const user = await this.client.db().collection('users').findOne({ email });
      return user;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async getUserById(id) {
    try {
      const userId = await this.client.db().collection('users').findOne({ _id: id });
      return userId;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async getUserByEmailAndPassword(email, password) {
    try {
      const user = await this.client.db().collection('users').findOne({ email, password: sha1(password) });
      return user;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async insertOneUser(user) {
    try {
      const res = await this.client.db().collection('users').insertOne(user);
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async getFiles() {
    try {
      const res = await this.client.db().collection('files').find().toArray();
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async getFileById(id) {
    try {
      const file = await this.client.db().collection('files').findOne({ _id: id });
      return file;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async insertOneFile(file) {
    try {
      const res = await this.client.db().collection('files').insertOne(file);
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
