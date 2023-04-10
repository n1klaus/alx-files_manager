/* eslint-disable no-bitwise */
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');
const fileTypes = require('../utils/constants');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const relPath = process.env.FOLDER_PATH || '/tmp/files_manager';

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
    const id = uuidv4();
    const localPath = path.join(relPath, id);
    const newFile = {
      userId,
      name,
      type,
      isPublic: Boolean(isPublic),
      parentId: parentId || 0,
      localPath,
    };
    if (type !== 'folder') {
      fs.mkdirSync(relPath, { recursive: true });
      const decodedData = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, decodedData);
    }
    const { insertedId } = await dbClient.insertOneFile(newFile);
    return res.status(201).json({
      id: insertedId,
      userId: newFile.userId,
      name: newFile.name,
      type: newFile.type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId,
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
    fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).send();
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
