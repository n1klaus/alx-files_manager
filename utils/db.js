import { MongoClient } from 'mongodb';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || '27017';
const DATABADE = process.env.DB_DATABASE || 'files_manager';

const URL = `mongodb://${HOST}:${PORT}/${DATABADE}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(URL, { useNewUrlParser: true });
  }

  isAlive() {
    return true ? this.client.connected : false;
  }

  async nbUsers() {
    const collection = await this.client.collection('users');
    return collection.count();
  }

  async nbFiles() {
    const collection = await this.client.collection('files');
    return collection.count();
  }
}

const dbClient = new DBClient();

export default dbClient;
