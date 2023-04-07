/* eslint-disable no-bitwise */
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const mime = require('mime-types');
const fileTypes = require('../utils/constants');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');
const fileQueue = require('../worker');
const {
  str2int,
  getFilePath,
  createSystemGroup,
  createSystemUser,
} = require('../utils/files');

class FilesController {
  static async postUpload(req, res) {
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !fileTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }
    let parentFile;
    if (parentId) {
      parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    let localPath;
    const user = await dbClient.getUserById(userId);
    const userName = user.email.split('@')[0];
    const { password } = user;
    const groupName = userName;
    const groupId = str2int(groupName);
    await createSystemGroup(groupName, groupId);
    await createSystemUser(userName, str2int(userId), groupId, password);
    if (type !== 'folder') {
      const filename = uuidv4();
      localPath = await getFilePath(filename, parentFile);
      const fileContent = Buffer.from(data, 'base64');
      fs.writeFile(localPath, fileContent, 'utf-8', (err) => {
        if (err) {
          throw err;
        }
        console.log('The file has been saved!');
      });
      fs.chown(localPath, str2int(userId), groupId, (err) => {
        if (err) {
          throw err;
        }
      });
    } else {
      localPath = await getFilePath(name, parentFile);
      fs.mkdir(localPath, { recursive: true }, (err) => {
        if (err) {
          throw err;
        }
        console.log('The folder has been created!');
      });
    }
    const newFile = {
      name,
      type,
      localPath,
      parentId: parentId || 0,
      isPublic: Boolean(isPublic),
      userId,
    };
    const file = await dbClient.insertOneFile(newFile);
    if (file.type === 'image') {
      fileQueue.add(file);
    }
    return res.status(201).json({
      id: file.insertedId,
      userId,
      name,
      type,
      isPublic: Boolean(isPublic),
      parentId: parentId || 0,
    });
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userFile = await dbClient.getUserFile(id, userId);
    if (!userFile) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(userFile);
  }

  static async getIndex(req, res) {
    const { parentId, page } = req.params;
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userFiles = await dbClient.aggregateFiles(userId, parentId);
    const result = userFiles.slice(20 * page, 20 * (page + 1));
    return res.status(200).json(result);
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userFile = await dbClient.getAndModifyFile(
      id,
      { userId },
      { isPublic: Boolean(true) },
    );
    if (!userFile) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(userFile);
  }

  static async putUnPublish(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userFile = await dbClient.getAndModifyFile(
      id,
      { userId },
      { isPublic: Boolean(false) },
    );
    if (!userFile) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json(userFile);
  }

  static async getFile(req, res) {
    const { id, size } = req.params;
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userFile = await dbClient.getUserFile(id, userId);
    if (!userFile || !userFile.isPublic) {
      return res.status(404).json({ error: 'Not found' });
    }
    let filePath = userFile.localPath;
    if (userFile.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't havecontent" });
    }
    if (userFile.type === 'image') {
      filePath += `_${size}`;
    }
    let fileContent;
    // eslint-disable-next-line consistent-return
    fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'Not found' });
      }
    });
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) throw err;
      fileContent = Buffer.from(data, 'base64');
    });
    res.set('Content-type', mime.lookup(userFile.name));
    return res.status(200).send(JSON.stringify(fileContent));
  }
}

module.exports = FilesController;
