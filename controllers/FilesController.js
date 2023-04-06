const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const fileTypes = require("../utils/constants");
const redisClient = require("../utils/redis");
const dbClient = require("../utils/db");
const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";

const getFilePath = (filename) => {
  return path.join(folderPath, filename);
};

class FilesController {
  static async postUpload(req, res) {
    try {
      const { name, type, parentId, isPublic, data } = req.body;
      const token = req.headers["x-token"];
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const key = `auth_${token}`;
      const userId = await redisClient.get(key);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!name) {
        return res.status(400).json({ error: "Missing name" });
      }
      if (!type || !fileTypes.includes(type)) {
        return res.status(400).json({ error: "Missing type" });
      }
      if (type !== "folder" && !data) {
        return res.status(400).json({ error: "Missing data" });
      }
      if (parentId) {
        const parentFile = await dbClient.getFileById(parentId);
        if (!parentFile) {
          return res.status(400).json({ error: "Parent not found" });
        }
        if (parentFile.type !== "folder") {
          return res.status(400).json({ error: "Parent is not a folder" });
        }
      }
      let localPath;
      if (type !== "folder") {
        const filename = uuidv4();
        localPath = getFilePath(filename);
        const fileContent = Buffer.from(data, "base64");
        await fs.writeFile(
          localPath,
          fileContent,
          (encoding = "utf-8"),
          (err) => {
            if (err) throw err;
            console.log("Writing successful");
          }
        );
        fs.chown(localPath, userId);
      }
      const newFile = {
        name,
        type,
        localPath,
        parentId: parentId || 0,
        isPublic: Boolean(isPublic),
        userId,
      };
      const { _insertedFileId } = await dbClient.insertOneFile(newFile);
      return res.status(201).json({
        id: _insertedFileId,
        userId,
        name,
        type,
        isPublic: Boolean(isPublic),
        parentId: parentId || 0,
      });
    } catch (err) {
      console.log("FileController Error: ", err);
    }
  }
}

module.exports = FilesController;
