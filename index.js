// const express = require("express");
// const http = require("http");
// const fs = require("fs");
// const cors = require("cors");
// // const fileRoutes = require("./routes/fileRoutes");
// const path = require("path");
// const app = express();
// const server = http.createServer(app);

// app.use(cors({ origin: "*" }));
// app.use(express.json());
// // app.use("/uploads", fileRoutes);
// const io = require("socket.io")(server, {
//   allowEIO3: true,
//   cors: {
//     origin: "*",
//     methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log("A user connected");

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });
// const config = {
//   uploadPath: "./uploads", // Directory where files will be uploaded
// };
// let uploads = {};
// app.post("/upload", async (req, res) => {
//   const fileId = req.query["fileId"];
//   const name = req.query["name"];
//   const mimetype = req.query["mimetype"];
//   const fileSize = parseInt(req.query["size"], 10);

//   if (!fileId || !name || !mimetype || !fileSize) {
//     return res.status(400).send("Missing required parameters");
//   }

//   if (!uploads[fileId]) uploads[fileId] = {};

//   const upload = uploads[fileId];

//   req.uploadPath = req.query.uploadPath || "";
//   if (req.query.uploadPath && req.query.directory) {
//     if (!fs.existsSync(config.uploadPath + req.uploadPath)) {
//       fs.mkdirSync(config.uploadPath + req.uploadPath, { recursive: true });
//     }
//     req.uploadPath = req.uploadPath + "/" + req.query.directory;
//   }

//   if (!fs.existsSync(config.uploadPath + req.uploadPath)) {
//     fs.mkdirSync(config.uploadPath + req.uploadPath, { recursive: true });
//   }

//   let fileStream;
//   if (!upload.bytesReceived) {
//     upload.bytesReceived = 0;
//     fileStream = fs.createWriteStream(
//       config.uploadPath + req.uploadPath + "/" + name,
//       { flags: "w" }
//     );
//   } else {
//     fileStream = fs.createWriteStream(
//       config.uploadPath + req.uploadPath + "/" + name,
//       { flags: "a" }
//     );
//   }

//   const total = req.headers["content-length"];
//   const body1 = [];
//   req.on("data", (data) => {
//     body1.push(data);
//     upload.bytesReceived += data.length;
//     const perc = parseInt((upload.bytesReceived / total) * 100);

//     const response = {
//       text: `Percent complete: ${perc}%`,
//       percentage: perc,
//       name: name,
//       mimetype: mimetype,
//       path: config.uploadPath + req.uploadPath + "/" + name,
//       filePath: req.uploadPath + "/" + name,
//     };
//     console.log(response, "response-----------");
//     // io.emit("progress", response);
//   });

//   req.pipe(fileStream);

//   req.on("end", () => {
//     if (upload.bytesReceived === fileSize) {
//       //   io.emit("upload-complete", {
//       //     message: "Upload complete",
//       //     name: name,
//       //     mimetype: mimetype,
//       //     path: config.uploadPath + req.uploadPath + "/" + name,
//       //   });
//       delete uploads[fileId];
//       res.send({ message: "Upload successful" });
//     } else {
//       io.emit("progress", { message: "File upload incomplete" });
//       res.status(500).send({ message: "File upload incomplete" });
//     }
//   });

//   req.on("error", (err) => {
//     console.error("Error during upload:", err);
//     // io.emit("progress", { message: `File upload error: ${err.message}` });
//     res.status(500).send({ message: `File upload error: ${err.message}` });
//     delete uploads[fileId];
//   });
// });

// app.get("/progress", (req, res) => {
//   // console.log("progress");
//   // let counter = 0;
//   // // Send a message on connection
//   // res.write("event: connected\n");
//   // res.write(`data: You are now subscribed!\n`);
//   // res.write(`id: ${counter}\n\n`);
//   // counter += 1;
//   // // Send a subsequent message every five seconds
//   // setInterval(() => {
//   //   res.write("event: message\n");
//   //   res.write(`data: ${new Date().toLocaleString()}\n`);
//   //   res.write(`id: ${counter}\n\n`);
//   //   counter += 1;
//   // }, 1000);
//   // // Close the connection when the client disconnects
//   // req.on("close", () => res.end("OK"));

//   console.log("progress");
//   let counter = 0;

//   // Set headers for Server-Sent Events (SSE)
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   // Send an initial message on connection
//   res.write("event: connected\n");
//   res.write(`data: You are now subscribed!\n`);
//   res.write(`id: ${counter}\n\n`);
//   counter += 1;

//   // File you want to send (path to the file)
//   const filePath = path.join(__dirname, "./uploads", "ClientList.csv");
//   const fileStream = fs.createReadStream(filePath);

//   // Read file chunks and stream them to the client
//   fileStream.on("data", (chunk) => {
//     res.write("event: file-data\n");
//     res.write(`data: ${chunk.toString()}\n`);
//     res.write(`id: ${counter}\n\n`);
//     counter += 1;
//   });

//   fileStream.on("end", () => {
//     res.write("event: file-complete\n");
//     res.write("data: File transfer complete\n\n");
//     res.end();
//   });

//   // Close the connection when the client disconnects
//   req.on("close", () => {
//     console.log("Connection closed by client");
//     fileStream.destroy();
//     res.end();
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const app = express();
const cors = require("cors");
app.use(cors({ origin: "*" }));
app.use(express.json());
// // Set up Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// app.post("/upload", (req, res) => {
//   let totalBytes = parseInt(req.headers["content-length"]); // Total size of all files
//   let uploadedBytes = 0;

//   req.on("data", (chunk) => {
//     uploadedBytes += chunk.length;
//     const progress = ((uploadedBytes / totalBytes) * 100).toFixed(2);
//     console.log(`Uploaded: ${progress}%`);
//     res.write(`Uploaded: ${progress}%\n`);
//   });

//   upload.array("files", 10)(req, res, (err) => {
//     if (err) {
//       return res.status(500).send("File upload failed.");
//     }
//     res.end("Files uploaded successfully.");
//   });
// });

// app.listen(5000, () => {
//   console.log("Server running on port 5000");
// });

// https://chatgpt.com/share/1a5390f5-f94a-48e9-8f9c-7dfacc4b32ce
// app.post("/upload", upload.array("files", 10), (req, res) => {
//   let totalBytes = parseInt(req.headers["content-length"]); // Total size of all files
//   let uploadedBytes = 0;

//   req.on("data", (chunk) => {
//     uploadedBytes += chunk.length;
//     const progress = ((uploadedBytes / totalBytes) * 100).toFixed(2);
//     console.log(`Uploaded: ${progress}%`);
//     // Update progress to frontend here
//   });

//   req.on("end", () => {
//     const files = req.files;

//     let processingFiles = files.length;

//     files.forEach((file) => {
//       const inputPath = file.path;
//       const outputPath = path.join(
//         "converted",
//         `${path.basename(
//           file.originalname,
//           path.extname(file.originalname)
//         )}.mp4`
//       );

//       // Start conversion
//       ffmpeg(inputPath)
//         .toFormat("mp4")
//         .on("end", () => {
//           processingFiles -= 1;
//           fs.unlinkSync(inputPath); // Clean up the original file

//           if (processingFiles === 0) {
//             // All files processed
//             res.status(200).send("Files uploaded and converted successfully.");
//           }
//         })
//         .on("error", (err) => {
//           console.error(err);
//           res.status(500).send("File conversion failed.");
//         })
//         .save(outputPath);
//     });
//   });
// });

// app.listen(5000, () => console.log("Server running on port 5000"));
