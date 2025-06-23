
'use strict';

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const port = 3001;
const baseMongoUri = process.env.MONGODB_URI;
const databaseName = 'resume_database';
const mongoUri = `${baseMongoUri}/${databaseName}?authSource=admin`;

// App Initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

/* ----------------------------------------------------------------------------
    health check api: /health
   ---------------------------------------------------------------------------- */

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/* ----------------------------------------------------------------------------
    API to fetch complete resume data: /api/data
   ---------------------------------------------------------------------------- */

app.get('/backend-api/data', async (req, res) => {
  console.log('Request received at /api/data');
  try {
    if (!db) 
    {
      console.log('Database connection is not established.');
      return res.status(500).json({ error: 'Database connection not established.' });
    }
    console.log('Database connection is established.');
    const resumeData = await db.collection('resume_data').find().toArray();
    console.log('Fetched resume data:', resumeData.length);
    res.status(200).json({ "data": resumeData });
    return res;
  } catch (error) {
    console.error('Error fetching resume data:', error);
    res.status(500).json({ error: 'Failed to fetch resume data.' });
  }
});

/* ----------------------------------------------------------------------------
    API to fetch data of a specific category from the resume_data collection: 
    /api/data/{category}
   ---------------------------------------------------------------------------- */

app.get('/backend-api/data/:category', async (req, res) => {
  const category = req.params.category;
  console.log(`Request received at /api/data/${category}`);
  try {
    if (!db) 
    {
      console.log('Database connection is not established.');
      return res.status(500).json({ error: 'Database connection not established.' });
    }
    console.log('Database connection is established.');
    const resumeData = await db.collection('resume_data').find({ category: category }).toArray();
    res.status(200).json({ "data": resumeData });
    return res;
  } catch (error) {
    console.error(`Error fetching data for category: '${category}':`, error);
    res.status(500).json({ error: `Failed to fetch data for category: '${category}'` });
  }
});

/* ----------------------------------------------------------------------------
    API to fetch specific property from the resume_metadata collection: 
    /api/metadata/{property}
   ---------------------------------------------------------------------------- */

app.get('/backend-api/metadata/:property', async (req, res) => {
  const property = req.params.property;
  console.log(`Request received at /api/metadata/${property}`);
  try {
    if (!db) 
    {
      console.log('Database connection is not established.');
      return res.status(500).json({ error: 'Database connection not established.' });
    }
    console.log('Database connection is established.');
    // fetch all the data from resume_metadata collection with the exception of _id property
    const resumeMetadataArray = await db.collection('resume_metadata').find({}, { _id: 0 }).toArray(); 
    // condition: if array is returned by above find function and its length > 0 and it has the requested metadata property
    if (resumeMetadataArray && resumeMetadataArray.length > 0 && resumeMetadataArray[0].hasOwnProperty(property)) 
    { 
      // store the value of that metadata property in requestedValue variable
      const requestedValue = resumeMetadataArray[0][property]; 
      res.status(200).json({ "data": requestedValue });
      return res;
    } 
    else 
    {
      res.status(404).json({ error: `Item '${property}' not found in metadata.` });
      return res;
    }
  } catch (error) {
    console.error(`Error fetching metadata item: '${property}':`, error);
    res.status(500).json({ error: `Failed to fetch metadata item: '${property}':` });
  }
});

/* ----------------------------------------------------------------------------
    Start the server
   ---------------------------------------------------------------------------- */

app.listen(port, () => {
  console.log(`Backend server is running on ${port}`);
});