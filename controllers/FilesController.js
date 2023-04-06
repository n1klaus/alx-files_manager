const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const fileTypes = require("../utils/constants");
const redisClient = require("../utils/redis");
const dbClient = require("../utils/db");
const {
  str2int,
  getFilePath,
  createSystemGroup,
  createSystemUser,
} = require("../utils/files");
const folderPath = process.env.FOLDER_PATH || "/tmp/files_manager";

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
      const user = await dbClient.getUserById(userId);
      const userName = user.email.split("@")[0];
      const password = user.password;
      const groupName = userName;
      const groupId = str2int(groupName);
      await createSystemGroup(groupName, groupId);
      await createSystemUser(userName, str2int(userId), groupId, password);
      if (type !== "folder") {
        const filename = uuidv4();
        localPath = await getFilePath(filename, parentFile);
        const fileContent = Buffer.from(data, "base64");
        await fs.writeFile(localPath, fileContent, "utf-8", (err) => {
          if (err) throw err;
          console.log("The file has been saved!");
        });
        await fs.chown(localPath, str2int(userId), groupId, (err) => {
          if (err) throw err;
        });
      } else {
        localPath = await getFilePath(name, parentFile);
        await fs.mkdir(localPath, { recursive: true }, (err) => {
          if (err) throw err;
          console.log("The folder has been created!");
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
      return res.status(201).json({
        id: file.insertedId,
        userId,
        name,
        type,
        isPublic: Boolean(isPublic),
        parentId: parentId || 0,
      });
    } catch (err) {
      console.log("FilesController Error: ", err);
    }
  }
}

module.exports = FilesController;
