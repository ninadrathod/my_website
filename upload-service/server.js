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

// --- Routine to read image list from 'images' directory ---
app.get('/getFileNames', function (req, res) {
  const directoryPath = path.join(__dirname, 'images');
  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    res.send(JSON.stringify(files));
    res.end();
  });
})
// --- End Routine ---

// --- API Endpoint: /deleteImage/:image_name ---
app.delete('/deleteImage/:image_name', (req, res) => {
  const imageName = req.params.image_name;
  const imagePath = path.join(__dirname, 'images', imageName); // Construct the full path

  // Check if the file exists before attempting to delete
  fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
          console.error(`[${new Date().toLocaleTimeString()}] File not found or inaccessible: ${imagePath}`);
          return res.status(404).json({ success: false, message: 'Image not found.' });
      }

      // Attempt to delete the file
      fs.unlink(imagePath, (err) => {
          if (err) {
              console.error(`[${new Date().toLocaleTimeString()}] Error deleting image '${imageName}':`, err);
              return res.status(500).json({ success: false, message: 'Failed to delete image.' });
          }
          console.log(`[${new Date().toLocaleTimeString()}] Image deleted successfully: ${imageName}`);
          res.status(200).json({ success: true, message: `Image '${imageName}' deleted successfully.` });
      });
  });
});
// ------ End of delete image api ---------------

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});