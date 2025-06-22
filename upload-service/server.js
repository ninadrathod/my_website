const express = require('express');
const cors = require('cors'); // Import cors
const path = require('path');      // Import path for multer
const multer = require('multer');  // Import multer
const fs = require('fs');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = 3002;


// Use cors middleware to allow cross-origin requests from your frontend
app.use(cors());
app.use(express.json());

const baseMongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const databaseName = 'resume_database';
const mongoUri = `${baseMongoUri}/${databaseName}?authSource=admin`;
const TIMESTAMP_COLLECTION_NAME = 'timestamp'; // New collection name for storing timestamps
const SESSION_DURATION_MS = 15 * 60 * 1000;      // 15 minutes in milliseconds

// MongoDB Connection
let db;

/* ----------------------------------------------------------------------------
    function to connect mongodb "resume_database"
   ---------------------------------------------------------------------------- */

async function connectMongo() 
{
  console.log('Attempting to connect to MongoDB with URI:', mongoUri);
  try {
    const client = await MongoClient.connect(mongoUri);
    db = client.db();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('Connection URI was:', mongoUri);
  }
}

connectMongo();

// ---------------- routines to manage timestamps for login sessions -----------------------

/* ----------------------------------------------------------------------------
    API to check if an entry exists in the "timestamp" collection:
    GET /api/doesTSexist
    - Returns true if at least one document is found in the "timestamp" collection.
    - Returns false otherwise.
   ---------------------------------------------------------------------------- */
   app.get('/api/doesTSexist', async (req, res) => {
    console.log('Request received at /api/doesTSexist.');
  
    try {
      // 1. Check if the database connection is established
      if (!db) {
        console.error('Database connection is not established.');
        return res.status(500).json({ error: 'Database connection not established.' });
      }
  
      const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);
  
      // 2. Count the number of documents in the collection
      // Using countDocuments({}) without any filter will count all documents.
      const count = await timestampCollection.countDocuments({});
  
      // 3. Determine if an entry exists based on the count
      const exists = count > 0;
      console.log(`Check for timestamp entry: ${exists ? 'Present' : 'Not Present'} (Count: ${count})`);
  
      return res.status(200).json({ exists: exists });
  
    } catch (error) {
      console.error('Error in /api/doesTSexist:', error);
      return res.status(500).json({ error: 'Failed to check timestamp existence.' });
    }
  });

/* ----------------------------------------------------------------------------
    API to create/update a single timestamp in the "timestamp" collection:
    POST /api/createTS
    - Calculates expiry timestamp (current time + 15 minutes).
    - Clears all existing documents from the "timestamp" collection.
    - Stores the new expiry timestamp in a new document.
   ---------------------------------------------------------------------------- */
   app.post('/api/createTS', async (req, res) => {
    console.log('Request received at /api/createTS.');
  
    try {
      // 1. Check if the database connection is established
      if (!db) {
        console.error('Database connection is not established.');
        return res.status(500).json({ error: 'Database connection not established.' });
      }
  
      const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);
  
      // 2. Calculate x = current timestamp + 15 minutes
      const currentTimestamp = Date.now(); // Get current time in milliseconds
      const expiryTimestamp = currentTimestamp + SESSION_DURATION_MS; // Calculate expiry time
      const expiryDate = new Date(expiryTimestamp); // Convert to Date object for MongoDB storage
  
      console.log(`Calculated expiry timestamp (x): ${expiryDate.toLocaleString()}`);
  
      // 3. Delete all existing documents from the "timestamp" collection
      console.log(`Deleting all existing documents from '${TIMESTAMP_COLLECTION_NAME}' collection...`);
      const deleteResult = await timestampCollection.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} documents from '${TIMESTAMP_COLLECTION_NAME}'.`);
  
      // 4. Store the value of "x" in a new row (document) in "timestamp" collection
      const insertResult = await timestampCollection.insertOne({
        value_x: expiryDate, // Store the Date object directly
      });
  
      return res.status(200).json({
        success: true,
        message: `Timestamp (x) set successfully to ${expiryDate.toLocaleString()}`,
        expiresAt: expiryDate.toISOString() // Return ISO string for frontend
      });
  
    } catch (error) {
      console.error('Error in /api/createTS:', error);
      return res.status(500).json({ error: 'Failed to create timestamp in database.' });
    }
  });


/* ----------------------------------------------------------------------------
    API to set the timestamp in the "timestamp" collection to 0 (epoch):
    POST /api/setTStoZero
    - Deletes all existing documents from the "timestamp" collection.
    - Stores a new document with value_x set to epoch 0.
   ---------------------------------------------------------------------------- */
   app.post('/api/setTStoZero', async (req, res) => {
    console.log('Request received at /api/setTStoZero.');
  
    try {
      // 1. Check if the database connection is established
      if (!db) {
        console.error('Database connection is not established.');
        return res.status(500).json({ error: 'Database connection not established.' });
      }
  
      const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);
  
      // 2. Delete all existing documents from the "timestamp" collection
      console.log(`Deleting all existing documents from '${TIMESTAMP_COLLECTION_NAME}' collection...`);
      const deleteResult = await timestampCollection.deleteMany({});
      console.log(`Deleted ${deleteResult.deletedCount} documents from '${TIMESTAMP_COLLECTION_NAME}'.`);
  
      // 3. Store the value_x: 0 in a new document
      const zeroTimestamp = new Date(0); // Represents January 1, 1970, 00:00:00 UTC (epoch)
  
      const insertResult = await timestampCollection.insertOne({
        value_x: zeroTimestamp, // Store the epoch Date object
        setAt: new Date()      // Optional: timestamp of when it was set to zero
      });
  
      console.log(`Timestamp set to 0. New document _id: ${insertResult.insertedId}`);
      return res.status(200).json({
        success: true,
        message: `Timestamp successfully set to 0.`,
        value_x: zeroTimestamp.toISOString() // Return ISO string for frontend
      });
  
    } catch (error) {
      console.error('Error in /api/setTStoZero:', error);
      return res.status(500).json({ error: 'Failed to set timestamp to zero.' });
    }
  });

/* ----------------------------------------------------------------------------
    API to check if the session (based on timestamp) is currently valid:
    GET /api/isSessionValid
    - Reads the expiry timestamp (value_x) from the "timestamp" collection.
    - Compares it with the current timestamp.
    - Returns true if current_timestamp < value_x, false otherwise.
   ---------------------------------------------------------------------------- */
   app.get('/api/isSessionValid', async (req, res) => {
    console.log('Request received at /api/isSessionValid.');
  
    try {
      // 1. Check if the database connection is established
      if (!db) {
        console.error('Database connection is not established.');
        return res.status(500).json({ error: 'Database connection not established.' });
      }
  
      const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);
  
      // 2. Read the value of "value_x" (expiry timestamp) from the "timestamp" collection.
      // Use findOne to get the single document.
      const timestampDocument = await timestampCollection.findOne({});
  
      // 3. Find the value of current timestamp and store it in "cur" variable.
      const cur = Date.now(); // Current timestamp in milliseconds
  
      if (!timestampDocument || !timestampDocument.value_x) {
        console.log('No timestamp entry found in collection. Session is not valid.');
        return res.status(200).json({ isValid: false, reason: "No timestamp found" });
      }
  
      const set_x = timestampDocument.value_x.getTime(); // Get expiry timestamp in milliseconds from BSON Date
  
      // 4. Compare the two timestamps: if cur > set_x return false, else return true
      const isValid = cur < set_x;
      
      console.log(`Current Time (cur): ${new Date(cur).toLocaleString()}`);
      console.log(`Expiry Time (set_x): ${new Date(set_x).toLocaleString()}`);
      console.log(`Session Valid: ${isValid}`);
  
      return res.status(200).json({ isValid: isValid });
  
    } catch (error) {
      console.error('Error in /api/isSessionValid:', error);
      return res.status(500).json({ error: 'Failed to check session validity.' });
    }
  });

// ---------------- End of routines to manage timestamps for login sessions ----------------

// Ensure the images directory exists on server startup
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log(`Created directory: ${imagesDir}`);
}

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
  console.log('Image upload request received.');
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
        senderEmail = process.env.SMTP_USER;
        await transporter.sendMail({
            from: senderEmail, // Sender address (your email)
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
const ADMIN_EMAIL = process.env.ADMIN_EMAILID; // Place this near your global variables or other constants

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