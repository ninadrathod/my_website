const express = require('express');
const cors = require('cors'); // Import cors
const path = require('path');      // Import path for multer
const multer = require('multer');  // Import multer
const fs = require('fs');

const app = express();
const port = 3002;

// Ensure the images directory exists on server startup
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`Created directory: ${imagesDir}`);
}

// Use cors middleware to allow cross-origin requests from your frontend
app.use(cors());

// Serve images from the /images directory as static files ---
// When a request comes to '/images/your_image.png', Express will look for
// 'your_image.png' inside the 'images' directory.
app.use('/images', express.static(imagesDir));
// --- End Static Serving ---


// --- Multer Configuration for Image Upload ---
// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // This path is relative to where server.js is running inside the container (/app)
    // So, it will save to /app/images, which maps to ./backend/images on your host.
    cb(null, 'images/');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using the current timestamp and original extension
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB file size limit (optional)
  fileFilter: (req, file, cb) => {
    // Allow only images (optional)
    checkFileType(file, cb);
  }
}).single('myImage'); // 'myImage' is the name attribute of the file input in your HTML form

// Function to check file type (optional)
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;  // Allowed ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());  // Check ext
  const mimetype = filetypes.test(file.mimetype); // Check mime

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}
// --- End Multer Configuration ---

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});


// --- Image Upload Route ---
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      res.status(400).send(`Error: ${err}`);
    } else {
      if (req.file == undefined) {
        res.status(400).send('Error: No File Selected!');
      } else {
        console.log(`File uploaded: ${req.file.filename}`);
        res.status(200).send(`File uploaded successfully: ${req.file.filename}`);
      }
    }
  });
});
// --- End Image Upload Route ---

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});