const { MongoClient, ObjectId } = require('mongodb');
const sha1 = require('sha1');

class DBClient {
  constructor () {
    const DB_HOST = process.env.DB_HOST || 'localhost';
    const DB_PORT = process.env.DB_PORT || 27017;
    const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
    const URL = `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`;

    this.client = new MongoClient(URL, { useUnifiedTopology: true });
    this.isConnected = false;
    (async () => {
      try {
        await this.client.connect((err) => {
          if (err) {
            return Promise.reject(err);
          } else {
            this.isConnected = true;
            return Promise.resolve(this.isConnected);
          }
        });
      } catch (err) {
        return Promise.reject(err);
      }
    })();
  }

  isAlive () {
    return this.isConnected;
  }

  async nbFiles () {
    try {
      const res = await this.client.db().collection('files').countDocuments();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getFiles () {
    try {
      const res = await this.client.db().collection('files').find().toArray();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getFileById (id) {
    try {
      const objId = new ObjectId(id);
      const res = await this.client
        .db()
        .collection('files')
        .findOne({ _id: objId });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getUserFile (fileId, userId) {
    try {
      const objId = new ObjectId(fileId);
      const res = await this.client
        .db()
        .collection('files')
        .findOne({ _id: objId, userId: userId });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getAndModifyFileBy (id, filterValues, updateValues) {
    try {
      const objId = new ObjectId(id);
      const res = await this.client
        .db()
        .collection('files')
        .findOneAndUpdate({ _id: objId, ...filterValues }, updateValues);
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async aggregateFiles (parentId, userId) {
    const pipeline = [
      { $match: { $parentId: parentId } },
      { $group: { _id: userId } },
      { $sort: { $name: -1 } },
      { $count: 'total_files' }
    ];
    try {
      const res = await this.client
        .db()
        .collection('files')
        .aggregate(pipeline)
        .toArray();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async insertOneFile (file) {
    try {
      const res = await this.client.db().collection('files').insertOne(file);
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async nbUsers () {
    try {
      const res = await this.client.db().collection('users').countDocuments();
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getUser (email) {
    try {
      const res = await this.client.db().collection('users').findOne({ email });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getUserById (id) {
    try {
      const res = await this.client
        .db()
        .collection('users')
        .findOne({ _id: id });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async getUserByEmailAndPassword (email, password) {
    try {
      const res = await this.client
        .db()
        .collection('users')
        .findOne({ email, password: sha1(password) });
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  async insertOneUser (user) {
    try {
      const res = await this.client.db().collection('users').insertOne(user);
      return Promise.resolve(res);
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
