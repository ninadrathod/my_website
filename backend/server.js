'use strict';

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const DEFAULT_PORT_FILE = 3001;
const port = process.env.PORT || DEFAULT_PORT_FILE; // Default to File 1's port if not set
const host = '0.0.0.0';

const baseMongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const databaseName = 'resume_database';
const mongoUri = `${baseMongoUri}/${databaseName}?authSource=admin`;

// App Initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
let db;

async function connectMongo() {
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

app.get('/', (req, res) => {
  res.send('Hello World from the combined server!');
});


app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/resume-data', async (req, res) => {
  console.log('Request received at /api/resume-data');
  try {
    if (!db) {
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

// Start the server
app.listen(port, host, () => {
  console.log(`Backend server is running on http://${host}:${port}`);
});