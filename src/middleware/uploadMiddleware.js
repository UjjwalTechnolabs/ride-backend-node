// uploadMiddleware.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/drivers/"); // Set the destination. Ensure the folder exists.
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set the file name.
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
