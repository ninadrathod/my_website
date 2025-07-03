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

const baseMongoUri = process.env.MONGODB_URI;// || 'mongodb://localhost:27017';
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
  //console.log('Attempting to connect to MongoDB with URI:', mongoUri);
  try {
    const client = await MongoClient.connect(mongoUri);
    db = client.db();
    //console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.error('Connection URI was:', mongoUri);
  }
}

connectMongo();

// ---------------- routines to manage timestamps for login sessions -----------------------

/* ----------------------------------------------------------------------------
    API to check if an entry exists for a specific session in the "timestamp" collection:
    GET /upload-service-api/doesTSexist
    - Takes 'sessionId' as a query parameter (e.g., /upload-service-api/doesTSexist?sessionId=abc).
    - Returns true if a document with the given 'sessionId' is found in the "timestamp" collection.
    - Returns false otherwise.
   ---------------------------------------------------------------------------- */
// Change the route to accept sessionId as a query parameter
app.get('/upload-service-api/doesTSexist', async (req, res) => {
  const { sessionId } = req.query; // Extract sessionId from query parameters
  //console.log(`Request received at /upload-service-api/doesTSexist for Session ID: ${sessionId}`);

  if (!sessionId) {
    console.error('Session ID is missing from query parameters.');
    return res.status(400).json({ error: 'Session ID is required as a query parameter.' });
  }

  try {
    // 1. Check if the database connection is established
    if (!db) {
      console.error('Database connection is not established.');
      return res.status(500).json({ error: 'Database connection not established.' });
    }

    const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);

    // 2. Count the number of documents that match the provided sessionId
    const count = await timestampCollection.countDocuments({ sessionId: sessionId });

    // 3. Determine if an entry exists based on the count
    const exists = count > 0;
    //console.log(`Check for timestamp entry for Session ID '${sessionId}': ${exists ? 'Present' : 'Not Present'} (Count: ${count})`);

    return res.status(200).json({ exists: exists });

  } catch (error) {
    console.error(`Error in /upload-service-api/doesTSexist for Session ID '${sessionId}':`, error);
    return res.status(500).json({ error: 'Failed to check timestamp existence.' });
  }
});


  /* ----------------------------------------------------------------------------
    API to create/update a timestamp for a specific session in the "timestamp" collection:
    POST /upload-service-api/createTS
    - Takes 'sessionId' as input from the request body.
    - Calculates expiry timestamp (current time + 15 minutes).
    - Updates the 'value_x' (expiry timestamp) and 'sessionId' for a matching document,
      or inserts a new document if the sessionId does not exist (upsert).
    - The previous delete-all behavior is removed to support multiple active sessions.
   ---------------------------------------------------------------------------- */
app.post('/upload-service-api/createTS', async (req, res) => {
  //console.log('Request received at /upload-service-api/createTS.');

  try {
    // 1. Check if the database connection is established
    if (!db) {
      console.error('Database connection is not established.');
      return res.status(500).json({ error: 'Database connection not established.' });
    }

    const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);

    // Extract sessionId from the request body
    const { sessionId } = req.body;

    if (!sessionId) {
      console.error('Session ID is missing in the request body.');
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    // 2. Calculate x = current timestamp + 15 minutes
    const currentTimestamp = Date.now(); // Get current time in milliseconds
    const expiryTimestamp = currentTimestamp + SESSION_DURATION_MS; // Calculate expiry time
    const expiryDate = new Date(expiryTimestamp); // Convert to Date object for MongoDB storage

    //console.log(`Calculated expiry timestamp (value_x): ${expiryDate.toLocaleString()} for Session ID: ${sessionId}`);

    // Store or Update the value of "value_x" and "sessionId" in a document.
    // Use updateOne with upsert: true to create a new document if sessionId doesn't exist,
    // or update the existing one if it does.
    const updateResult = await timestampCollection.updateOne(
      { sessionId: sessionId }, // Filter by sessionId
      {
        $set: {
          value_x: expiryDate, // Store the Date object directly
          createdAt: new Date() // Optional: timestamp of when this entry was created/last updated
        }
      },
      { upsert: true } // Create the document if it doesn't exist
    );

    let message;
    if (updateResult.upsertedCount > 0) {
      message = `New timestamp document created for Session ID: ${sessionId}.`;
    } else if (updateResult.modifiedCount > 0) {
      message = `Timestamp updated for existing Session ID: ${sessionId}.`;
    } else {
      message = `Timestamp for Session ID: ${sessionId} was already up-to-date.`;
    }
    //console.log(message);

    return res.status(200).json({
      success: true,
      message: `${message} Expires at: ${expiryDate.toLocaleString()}`,
      expiresAt: expiryDate.toISOString(), // Return ISO string for frontend
      sessionId: sessionId // Confirm the session ID that was processed
    });

  } catch (error) {
    console.error('Error in /upload-service-api/createTS:', error);
    return res.status(500).json({ error: 'Failed to create/update timestamp in database.' });
  }
});

/* ----------------------------------------------------------------------------
    API to invalidate a specific session's timestamp in the "timestamp" collection:
    POST /upload-service-api/setTStoZero
    - Takes 'sessionId' as input from the request body.
    - Sets the 'value_x' for the document matching 'sessionId' to epoch 0.
      If no document matches, it can optionally create one with an invalid timestamp (upsert).
    - The previous delete-all behavior is removed to protect other sessions.
   ---------------------------------------------------------------------------- */
   app.post('/upload-service-api/setTStoZero', async (req, res) => {
    //console.log('Request received at /upload-service-api/setTStoZero.');
  
    try {
      // 1. Check if the database connection is established
      if (!db) {
        console.error('Database connection is not established.');
        return res.status(500).json({ error: 'Database connection not established.' });
      }
  
      const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);
  
      // Extract sessionId from the request body
      const { sessionId } = req.body;
  
      if (!sessionId) {
        console.error('Session ID is missing in the request body.');
        return res.status(400).json({ error: 'Session ID is required.' });
      }
    
      // Set value_x to 0 (epoch) for the specific sessionId.
      const zeroTimestamp = new Date(0); // Represents January 1, 1970, 00:00:00 UTC (epoch)
  
      const updateResult = await timestampCollection.updateOne(
        { sessionId: sessionId }, // Filter by sessionId
        {
          $set: {
            value_x: zeroTimestamp, // Store the epoch Date object
            lastUpdated: new Date() // Optional: timestamp of when it was invalidated
          }
        },
        { upsert: true } // If document doesn't exist, create it with value_x: 0
      );
  
      let message;
      if (updateResult.upsertedCount > 0) {
        message = `New timestamp document created and set to 0 for Session ID: ${sessionId}.`;
      } else if (updateResult.modifiedCount > 0) {
        message = `Timestamp for existing Session ID '${sessionId}' set to 0.`;
      } else {
        // This means a document for sessionId existed, but its value_x was already 0 (or equivalent)
        message = `Timestamp for Session ID '${sessionId}' was already 0 or no change needed.`;
      }
      //console.log(message);
  
      return res.status(200).json({
        success: true,
        message: message,
        sessionId: sessionId,
        value_x: zeroTimestamp.toISOString() // Return ISO string for frontend
      });
  
    } catch (error) {
      console.error('Error in /upload-service-api/setTStoZero:', error);
      return res.status(500).json({ error: 'Failed to set timestamp to zero.' });
    }
  });
  
/* ----------------------------------------------------------------------------
    API to check if a specific session is currently valid:
    GET /upload-service-api/isSessionValid
    - Takes 'sessionId' as a query parameter.
    - Reads the 'value_x' (expiry timestamp) from the document matching 'sessionId'.
    - Compares it with the current timestamp.
    - Returns true if current_timestamp < value_x for that specific sessionId, false otherwise.
   ---------------------------------------------------------------------------- */
   app.get('/upload-service-api/isSessionValid', async (req, res) => {
    const { sessionId } = req.query; // Extract sessionId from query parameters
    //console.log(`Request received at /upload-service-api/isSessionValid for Session ID: ${sessionId}`);
  
    if (!sessionId) {
      console.error('Session ID is missing from query parameters.');
      return res.status(400).json({ error: 'Session ID is required as a query parameter.' });
    }
  
    try {
      // 1. Check if the database connection is established
      if (!db) {
        console.error('Database connection is not established.');
        return res.status(500).json({ error: 'Database connection not established.' });
      }
  
      const timestampCollection = db.collection(TIMESTAMP_COLLECTION_NAME);
  
      // 2. Read the document for the given sessionId
      // Use findOne with a filter for sessionId
      const timestampDocument = await timestampCollection.findOne({ sessionId: sessionId });
  
      // 3. Find the value of current timestamp and store it in "cur" variable.
      const cur = Date.now(); // Current timestamp in milliseconds
  
      // Check if document was found AND contains the value_x property
      if (!timestampDocument || !timestampDocument.value_x) {
        //console.log(`No valid timestamp entry found for Session ID: ${sessionId}. Session is not valid.`);
        return res.status(200).json({ isValid: false, reason: "No timestamp found for this session ID" });
      }
  
      const set_x = timestampDocument.value_x.getTime(); // Get expiry timestamp in milliseconds from BSON Date
  
      // 4. Compare the two timestamps: if cur > set_x return false, else return true
      const isValid = cur < set_x;
      
      //console.log(`For Session ID: ${sessionId}`);
      //console.log(`Current Time (cur): ${new Date(cur).toLocaleString()}`);
      //console.log(`Expiry Time (set_x): ${new Date(set_x).toLocaleString()}`);
      //console.log(`Session Valid: ${isValid}`);
  
      // If session is found but expired, you might want to return an additional reason
      if (!isValid) {
        return res.status(200).json({ isValid: false, reason: "Session expired" });
      }
  
      return res.status(200).json({ isValid: isValid });
  
    } catch (error) {
      console.error(`Error in /upload-service-api/isSessionValid for Session ID '${sessionId}':`, error);
      return res.status(500).json({ error: 'Failed to check session validity.' });
    }
  });
  
  
// ---------------- End of routines to manage timestamps for login sessions ----------------

// Ensure the images directory exists on server startup
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
    //console.log(`Created directory: ${imagesDir}`);
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
app.post('/upload-service-api/upload', (req, res) => {
  //console.log('Image upload request received.');
  upload(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      res.status(400).send(`Error: ${err}`);
    } else {
      if (req.file == undefined) {
        res.status(400).send('Error: No File Selected!');
      } else {
        //console.log(`File uploaded: ${req.file.filename}`);
        res.status(200).send(`File uploaded successfully: ${req.file.filename}`);
      }
    }
  });
});
// --- End Image Upload Route ---

// --- Routine to read image list from 'images' directory ---
app.get('/upload-service-api/getFileNames', function (req, res) {
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
app.delete('/upload-service-api/deleteImage/:image_name', (req, res) => {
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
          ////console.log`[${new Date().toLocaleTimeString()}] Image deleted successfully: ${imageName}`);
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

/** HELPER FUNCTION
 * Stores a given number in the "otp" collection in MongoDB.
 *
 * param {number} otpNumber The number (OTP) to be stored.
 * returns {Promise<number>} A Promise that resolves with the stored number if successful,
 * or -1 if the number could not be stored.
 */
async function storeOtpInDb(otpNumber) {
  if (!db) {
    console.error('Database connection is not established. Cannot store OTP.');
    return -1;
  }

  if (typeof otpNumber !== 'number') {
    console.error('Invalid input: OTP must be a number.');
    return -1;
  }

  try {
    const otpCollection = db.collection('otp'); // Get the 'otp' collection

    // Store the OTP along with a timestamp for potential expiry management later
    const result = await otpCollection.insertOne({
      otp: otpNumber,
      createdAt: new Date() // Record when the OTP was created
    });

    if (result.acknowledged && result.insertedId) {
      //console.log`OTP '${otpNumber}' stored successfully with ID: ${result.insertedId}`);
      return otpNumber; // Return the stored number on success
    } else {
      console.error(`Failed to store OTP '${otpNumber}'. Insert operation not acknowledged or no ID returned.`);
      return -1; // Return -1 on failure
    }
  } catch (error) {
    console.error(`Error storing OTP '${otpNumber}' in database:`, error);
    return -1; // Return -1 on error
  }
}

/** HELPER FUNCTION
 * Reads the most recently stored OTP from the "otp" collection.
 * This function retrieves the OTP that was last inserted into the collection,
 * which is a common pattern for single-user or single-active-OTP scenarios.
 *
 * returns {Promise<number | -1>} A Promise that resolves with the most recently stored OTP number if found,
 * or -1 if no OTPs exist in the collection, the retrieved OTP is not a number,
 * or if there's a database connection or query error.
 */
async function readLatestOtpFromDb() {
  if (!db) {
    console.error('Database connection is not established. Cannot read OTP.');
    return -1;
  }

  try {
    const otpCollection = db.collection('otp');

    // Find the latest OTP by sorting by 'createdAt' in descending order (most recent first)
    // and limiting the result to one document.
    const latestOtpDocument = await otpCollection.findOne(
      {}, // Empty query filter to find any document
      { sort: { createdAt: -1 } } // Sort by the 'createdAt' field in descending order
    );

    // Check if a document was found and if it contains a valid OTP number
    if (latestOtpDocument && typeof latestOtpDocument.otp === 'number') {
      //console.log`Successfully retrieved latest OTP: ${latestOtpDocument.otp}`);
      return latestOtpDocument.otp;
    } else {
      //console.log'No valid OTP found in the "otp" collection.');
      return -1;
    }
  } catch (error) {
    console.error('Error reading OTP from database:', error);
    return -1;
  }
}

/**
 * Deletes all documents from the "otp" collection.
 * This is useful for clearing out old or used OTPs.
 *
 * returns {Promise<0 | 1>} A Promise that resolves with 1 if the operation is successful,
 * or 0 if there's a database connection error, a deletion error, or if the operation
 * could not be acknowledged.
 */
async function deleteAllOtpsFromDb() {
  if (!db) {
    console.error('Database connection is not established. Cannot delete OTPs.');
    return 0; // Return 0 if database is not connected
  }

  try {
    const otpCollection = db.collection('otp');

    // Use deleteMany with an empty filter to delete all documents in the collection
    const result = await otpCollection.deleteMany({});

    if (result.acknowledged) {
      //console.log`Successfully deleted ${result.deletedCount} OTP entries from the "otp" collection.`);
      return 1; // Return 1 on successful deletion (acknowledged)
    } else {
      console.error('Failed to delete OTP entries. Operation not acknowledged.');
      return 0; // Return 0 if operation not acknowledged
    }
  } catch (error) {
    console.error('Error deleting all OTPs from database:', error);
    return 0; // Return 0 on any database error
  }
}

/**
 * API Endpoint: /upload-service-api/sendOTP/:variableEmailID
 *
 * This API generates a random 5-digit OTP, sends it to the specified email ID
 * using Nodemailer, and stores the generated OTP in the "otp" MongoDB collection.
 * It returns the generated OTP in the response if successful.
 */
app.get('/upload-service-api/sendOTP/:variableEmailID', async (req, res) => {
  // 1. Extract the email ID from the URL parameters
  const recipientEmail = req.params.variableEmailID;

  // 2. Generate a random 5-digit number (OTP)
  const otp = Math.floor(10000 + Math.random() * 90000);
  //console.log`Generated OTP: ${otp} for email: ${recipientEmail}`);

  // REMOVED: Assignments to global variables storedOtp and storedOtpEmail.
  // OTP will now be stored in the database.

  try {
      // OPTIONAL BUT RECOMMENDED: Delete any existing OTPs before storing a new one
      // This ensures only one active OTP exists at a time, preventing confusion or stale OTP usage.
      const deleteResult = await deleteAllOtpsFromDb();
      if (deleteResult === 0) {
          console.warn('Could not clear old OTPs before generating a new one.');
          // Decide if this should block the operation. For critical systems, it might.
          // For now, it's a warning.
      }

      // 3. Store the generated OTP in the MongoDB "otp" collection
      const storeResult = await storeOtpInDb(otp);

      if (storeResult === -1) {
          console.error('Failed to store OTP in database. Aborting email send.');
          return res.status(500).json({
              message: 'Failed to store OTP in database.',
              error: 'Database storage error.'
          });
      }

      // 4. Use the transporter to send that random number to {variableEmailID}
      const senderEmail = process.env.SMTP_USER; // Ensure SMTP_USER is set in your environment
      await transporter.sendMail({
          from: senderEmail, // Sender address (your email)
          to: recipientEmail, // Recipient email from URL parameter
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

      //console.log('Email sent successfully!');
      // 5. Return success message
      res.status(200).json({
          message: 'OTP sent successfully!',
          email: recipientEmail,
      });

  } catch (error) {
      console.error('Error sending email or storing OTP:', error);
      // Do not clear OTP from DB here, as it might be used if email failed for non-storage reason
      // The deleteAllOtpsFromDb() call at the beginning of the next send will handle it.
      res.status(500).json({
          message: 'Failed to send OTP or store it.',
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

app.get('/upload-service-api/isAdminEmail/:enteredEmail', (req, res) => {
    const enteredEmail = req.params.enteredEmail.toLowerCase(); // Convert to lowercase for case-insensitive comparison
    //console.log(`[${new Date().toLocaleTimeString()}] Checking if '${enteredEmail}' is admin email.`);

    if (enteredEmail === ADMIN_EMAIL.toLowerCase()) {
        res.status(200).json({ success: true, message: 'Email is an admin email.' });
    } else {
        res.status(200).json({ success: false, message: 'Email is not an admin email.' });
    }
});

/**
 * API Endpoint: /upload-service-api/OTPverify/:passedOTP
 *
 * Verifies the passed OTP against the OTP stored in the "otp" MongoDB collection.
 * If verification is successful, all OTP entries in the collection are deleted.
 * If verification fails, all OTP entries are also deleted (as per original request behavior).
 */
app.get('/upload-service-api/OTPverify/:passedOTP', async (req, res) => { // Made async to use await
  const passedOtp = parseInt(req.params.passedOTP, 10); // Convert URL parameter to an integer

  //console.log(`[${new Date().toLocaleTimeString()}] OTP Verification Attempt for Passed OTP: ${passedOtp}`);

  let verificationSuccess = false;
  let message = '';

  try {
      // 1. Read the most recently stored OTP from the database
      const storedOtpInDb = await readLatestOtpFromDb();

      //console.log(`[${new Date().toLocaleTimeString()}] Stored OTP from DB: ${storedOtpInDb}`);

      // 2. Check if an OTP was found in the DB and if it matches the passed OTP
      if (storedOtpInDb !== -1 && passedOtp === storedOtpInDb) {
          //console.log(`[${new Date().toLocaleTimeString()}] OTP verification successful!`);
          verificationSuccess = true;
          message = 'OTP verified successfully!';
      } else {
          //console.log(`[${new Date().toLocaleTimeString()}] OTP verification failed: Mismatch or no active OTP.`);
          verificationSuccess = false;
          message = 'Invalid OTP or no active OTP.';
      }

  } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error during OTP verification process:`, error);
      verificationSuccess = false; // Ensure failure on error
      message = 'An error occurred during verification.';
  } finally {
      // 3. Delete all OTP entries from the database, regardless of verification success or failure
      // This invalidates the OTP after an attempt, preventing reuse.
      const deleteResult = await deleteAllOtpsFromDb();
      if (deleteResult === 1) {
          //console.log(`[${new Date().toLocaleTimeString()}] OTP entries cleared from database.`);
      } else {
          console.error(`[${new Date().toLocaleTimeString()}] Failed to clear OTP entries from database.`);
          // Decide if you want to return a 500 here if deletion fails after a successful match.
          // For now, it won't change the success status of verification itself.
      }

      // 4. Send the appropriate response
      if (verificationSuccess) {
          res.status(200).json({ success: true, message: message });
      } else {
          res.status(401).json({ success: false, message: message });
      }
  }
});

app.listen(port, () => {
  //console.log(`Upload-service server listening at ${port}`);
});