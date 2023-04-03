const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
    const URL = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

    this.client = new MongoClient(URL, { useUnifiedTopology: true });
  }

  async isAlive() {
    try {
      await this.client.connect();
      await this.client.db().admin().ping();
      return true;
    } catch (err) {
      return false;
    }
  }

  async nbUsers() {
    try {
      await this.client.connect();
      const res = await this.client.db().collection('users').countDocuments();
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }

  async nbFiles() {
    try {
      await this.client.connect();
      const res = await this.client.db().collection('files').countDocuments();
      return res;
    } catch (err) {
      console.log('MongoDB error: ', err);
      return -1;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
