
'use strict';

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs').promises;

const port = 3001;

// App Initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/* ----------------------------------------------------------------------------
    health check api: /health
   ---------------------------------------------------------------------------- */

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/* ----------------------------------------------------------------------------
   Reads a JSON file, filters the data by category, and returns the result.
   param {string} category The category to filter by (e.g., 'work_exp', 'education').
   returns {Promise<Array>} A promise that resolves with an array of filtered objects.
   ---------------------------------------------------------------------------- */

async function getFilteredData(category) {
  try {
      const data = await fs.readFile('./data.json', 'utf8');
      const jsonData = JSON.parse(data);
      const filteredData = jsonData.filter(item => item.category === category);
      return filteredData;
  } catch (error) {
      console.error('Error fetching data:', error);
      return []; // Return an empty array in case of an error
  }
}

/* ----------------------------------------------------------------------------
   Reads the metadata.json file and returns the single metadata object.
   returns {Promise<Object>} A promise that resolves with the metadata object.
   ---------------------------------------------------------------------------- */
async function getMetadata() {
  const filePath = './metadata.json';
  try {
      const data = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);
      
      // The JSON file contains a single object inside an array, so we return the first element.
      return jsonData;
  } catch (error) {
      console.error(`Error reading or parsing ${filePath}:`, error);
      return null; // Return null in case of an error
  }
}

/* ----------------------------------------------------------------------------
    API to fetch data of a specific category from the resume_data collection: 
    /api/data/{category}
   ---------------------------------------------------------------------------- */

app.get('/backend-api/data/:category', async (req, res) => {
  const category = req.params.category;
  //console.log(`Request received at /api/data/${category}`);
  try {
    const resumeData = await getFilteredData(category);
    //console.log('Fetched resume data using get filteredData:', resumeData.length);
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
  //console.log(`Request received at /api/metadata/${property}`);
  try {
    // fetch all the data from resume_metadata collection with the exception of _id property
    const resumeMetadataArray = await getMetadata();
    //console.log('Fetched resume metadata using getMetadata:', resumeMetadataArray.length);
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
  //console.log(`Backend server is running on ${port}`);
});