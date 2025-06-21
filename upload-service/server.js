const express = require('express');
const cors = require('cors'); // Import cors
const path = require('path');      // Import path for multer
const multer = require('multer');  // Import multer
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();

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

let storedOtp = null;
let storedOtpEmail = null;

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

// ------ Routine to send email -----------------

// Access the environment variables and configure the transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10), // Convert port to a number
  secure: process.env.SMTP_SECURE === 'true', // Convert "true" string to boolean true
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * API Endpoint: /sendOTP/:variableEmailID
 *
 * This API generates a random 5-digit OTP, sends it to the specified email ID
 * using Nodemailer, and returns the generated OTP in the response.
 */
app.get('/sendOTP/:variableEmailID', async (req, res) => {
    // 1. Extract the email ID from the URL parameters
    const recipientEmail = req.params.variableEmailID;

    // 2. Generate a random 5-digit number (OTP)
    const otp = Math.floor(10000 + Math.random() * 90000);
    console.log(`Generated OTP for email: ${recipientEmail}`);
    storedOtp = otp;
    storedOtpEmail = recipientEmail;

    try {
        // 3. Use the transporter to send that random number to {variableEmailID}
        await transporter.sendMail({
            from: 'ninadrathod267@gmail.com', // Sender address (your email)
            to: recipientEmail,             // Recipient email from URL parameter
            subject: 'Your One-Time Password (OTP)', // Email subject
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello!</h2>
                    <p>Your One-Time Password (OTP) for your recent request is:</p>
                    <h1 style="color: #007bff; font-size: 2em; margin: 15px 0;">${otp}</h1>
                    <p>This OTP is valid for a short period. Please do not share it with anyone.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Regards,<br>No One</p>
                </div>
            ` // HTML body of the email
        });

        console.log('Email sent successfully!');
        // 4. Return the same number (OTP) to the calling script
        res.status(200).json({
            message: 'OTP sent successfully!',
            email: recipientEmail
        });

    } catch (error) {
        console.error('Error sending email:', error);
        storedOtp = null;
        storedOtpEmail = null;
        res.status(500).json({
            message: 'Failed to send OTP.',
            error: error.message
        });
    }
});

// --- End of email send routine ---

/**
 * API Endpoint: /isAdminEmail/:enteredEmail
 *
 * This API checks if the provided email matches the hardcoded admin email.
 * Returns { success: true } if it's the admin email, else { success: false }.
 */
// Define the Admin Email
const ADMIN_EMAIL = 'ninadrathod267@gmail.com'; // Place this near your global variables or other constants

app.get('/isAdminEmail/:enteredEmail', (req, res) => {
    const enteredEmail = req.params.enteredEmail.toLowerCase(); // Convert to lowercase for case-insensitive comparison
    console.log(`[${new Date().toLocaleTimeString()}] Checking if '${enteredEmail}' is admin email.`);

    if (enteredEmail === ADMIN_EMAIL.toLowerCase()) {
        res.status(200).json({ success: true, message: 'Email is an admin email.' });
    } else {
        res.status(200).json({ success: false, message: 'Email is not an admin email.' });
    }
});

/**
 * API Endpoint: /OTPverify/:passedOTP
 *
 * Verifies the passed OTP against the locally stored OTP.
 * Returns success/fail and invalidates the stored OTP (regardless of match, as per request).
 *
 * !!! WARNING: This is for demonstration purposes ONLY. Not suitable for production.
 */
app.get('/OTPverify/:passedOTP', (req, res) => {
    const passedOtp = parseInt(req.params.passedOTP, 10); // Convert URL parameter to an integer

    console.log(`[${new Date().toLocaleTimeString()}] Verification attempt: Passed OTP = ${passedOtp}, Stored OTP = ${storedOtp}`);

    // Check if an OTP was actually stored and if it matches the passed one
    if (storedOtp !== null && passedOtp === storedOtp) {
        console.log(`[${new Date().toLocaleTimeString()}] OTP verification successful for ${storedOtpEmail}!`);
        // Invalidate the stored OTP after successful verification
        storedOtp = null;
        storedOtpEmail = null; // Clear associated email too
        res.status(200).json({ success: true, message: 'OTP verified successfully!' });
    } else {
        // OTP does not match, or no OTP was currently stored/active
        console.log(`[${new Date().toLocaleTimeString()}] OTP verification failed!`);
        // Invalidate the OTP on failure as per your request, to prevent further attempts with the same OTP.
        // In a real system, you might allow a few failed attempts or let it expire naturally.
        storedOtp = null;
        storedOtpEmail = null;
        res.status(401).json({ success: false, message: 'Invalid OTP or not an active OTP.' });
    }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});