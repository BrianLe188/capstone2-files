import dotenv from "dotenv";
dotenv.config();
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = path.join(__dirname, "..", "upload", req.params.folder);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder);
    }
    cb(null, path.join(__dirname, "..", "upload"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      req.params.folder + "/" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

app.post("/upload/:folder", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully!");
});

app.listen(3000, () => {
  console.log("File service listening on port");
});
