const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const fileTypes = require('../utils/constants');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const getFilePath = (filename) => {
  const folderPath = process.env.UPLOAD_PATH || '/tmp/files_manager';
  return path.join(folderPath, filename);
};

class FilesController {
  static async postUpload(req, res) {
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!token) {
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
    if (parentId) {
      const parentFile = await dbClient.getFileById(parentId);
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    let filePath;
    if (type !== 'folder') {
      const filename = uuidv4();
      filePath = getFilePath(filename);
      const fileContent = Buffer.from(data, 'base64');
      await fs.promises.writeFile(filePath, fileContent);
    }

    const newFile = {
      name,
      type,
      parentId: parentId || 0,
      isPublic: Boolean(isPublic),
      userId,
    };
    const { _insertedFileId } = await dbClient.insertOneFile(newFile);
    // const insertedFile = { id: _insertedFileId, name };
    return res.status(201).json({
      id: _insertedFileId,
      userId,
      name,
      type,
      isPublic: Boolean(isPublic),
      parentId: parentId || 0,

    });
  }
}

module.exports = FilesController;
