const express = require("express");
const http = require("http");
const fs = require("fs");
const cors = require("cors");
// const fileRoutes = require("./routes/fileRoutes");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
// app.use("/uploads", fileRoutes);
const io = require("socket.io")(server, {
  allowEIO3: true,
  cors: {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
const config = {
  uploadPath: "./uploads", // Directory where files will be uploaded
};
let uploads = {};
app.post("/upload", async (req, res) => {
  const fileId = req.query["fileId"];
  const name = req.query["name"];
  const mimetype = req.query["mimetype"];
  const fileSize = parseInt(req.query["size"], 10);

  if (!fileId || !name || !mimetype || !fileSize) {
    return res.status(400).send("Missing required parameters");
  }

  console.log("tes");
  if (!uploads[fileId]) uploads[fileId] = {};

  const upload = uploads[fileId];

  req.uploadPath = req.query.uploadPath || "";
  if (req.query.uploadPath && req.query.directory) {
    if (!fs.existsSync(config.uploadPath + req.uploadPath)) {
      fs.mkdirSync(config.uploadPath + req.uploadPath, { recursive: true });
    }
    req.uploadPath = req.uploadPath + "/" + req.query.directory;
  }

  if (!fs.existsSync(config.uploadPath + req.uploadPath)) {
    fs.mkdirSync(config.uploadPath + req.uploadPath, { recursive: true });
  }

  let fileStream;
  if (!upload.bytesReceived) {
    upload.bytesReceived = 0;
    fileStream = fs.createWriteStream(
      config.uploadPath + req.uploadPath + "/" + name,
      { flags: "w" }
    );
  } else {
    fileStream = fs.createWriteStream(
      config.uploadPath + req.uploadPath + "/" + name,
      { flags: "a" }
    );
  }

  const total = req.headers["content-length"];
  req.on("data", (data) => {
    upload.bytesReceived += data.length;
    const perc = parseInt((upload.bytesReceived / total) * 100);

    const response = {
      text: `Percent complete: ${perc}%`,
      percentage: perc,
      name: name,
      mimetype: mimetype,
      path: config.uploadPath + req.uploadPath + "/" + name,
      filePath: req.uploadPath + "/" + name,
    };
    console.log(response, "response-----------");
    // io.emit("progress", response);
  });

  req.pipe(fileStream);

  req.on("end", () => {
    if (upload.bytesReceived === fileSize) {
      //   io.emit("upload-complete", {
      //     message: "Upload complete",
      //     name: name,
      //     mimetype: mimetype,
      //     path: config.uploadPath + req.uploadPath + "/" + name,
      //   });
      delete uploads[fileId];
      res.send({ message: "Upload successful" });
    } else {
      io.emit("progress", { message: "File upload incomplete" });
      res.status(500).send({ message: "File upload incomplete" });
    }
  });

  req.on("error", (err) => {
    console.error("Error during upload:", err);
    // io.emit("progress", { message: `File upload error: ${err.message}` });
    res.status(500).send({ message: `File upload error: ${err.message}` });
    delete uploads[fileId];
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
