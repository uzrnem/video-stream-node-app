const express = require("express");
const fs = require("fs");
const path = require("path")

const app = express();

const getAllFiles = function(dirPath, parent, obj) {
  files = fs.readdirSync(dirPath)
  obj = obj || {}

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      obj = getAllFiles(dirPath + "/" + file, file, obj)
    } else {
      if (file.endsWith(".mp4")) {
        obj[parent] = obj[parent] || {}
        obj[parent][file] = path.join(__dirname, dirPath, "/", file)
      }
    }
  })

  return obj
}

app.use('/', express.static('public'));
app.use('/', express.static('course'));

app.get("/files", function (req, res) {
  res.json(getAllFiles('course', '', {}))
})

app.get("/video", function (req, res) {
  // Ensure there is a range given for the video
  const range = req.headers.range;
  if (!range) {
    res.status(400).send("Requires Range header");
  }

  const videoPath = req.query.path;
  const videoSize = fs.statSync(videoPath).size;

  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});

app.listen(3001, function () {
  console.log("Listening on port 3001!");
});
