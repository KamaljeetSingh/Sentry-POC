const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const path = require('path');

dotenv.config();

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

const SENTRY_TOKEN = process.env.SENTRY_AUTH_TOKEN;
const SENTRY_ORG_SLUG = process.env.SENTRY_ORG_SLUG;
const SENTRY_PROJECT_SLUG = process.env.SENTRY_PROJECT_SLUG;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// Construct Sentry API URL according to documentation
const sentryApiUrl = `https://sentry.io/api/0/projects/${SENTRY_ORG_SLUG}/${SENTRY_PROJECT_SLUG}/issues/`;

// Helper function to convert natural language to Sentry API queries
async function processNaturalLanguageQuery(query) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are a helpful assistant that translates natural language queries about application errors into Sentry API parameters. 
          You must respond with ONLY a valid JSON object containing these properties:
          - statsPeriod: time period (e.g., "24h", "7d", "14d")
          - query: search query (e.g., "is:unresolved", "level:error")
          - sort: sorting method (e.g., "freq", "date")
          - limit: number of results (e.g., 5)
          
          Example response:
          {
            "statsPeriod": "24h",
            "query": "is:unresolved",
            "sort": "freq",
            "limit": 5
          }
          
          Do not include any other text or explanation, only the JSON object.` 
        },
        { role: "user", content: query }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
    });
    
    const response = completion.choices[0].message.content;
    // Clean the response to ensure it's valid JSON
    const cleanResponse = response.replace(/```json\n|\n```/g, '').trim();
    const apiParams = JSON.parse(cleanResponse);
    return apiParams;
  } catch (error) {
    console.error('Error processing natural language query:', error);
    return { 
      statsPeriod: '24h',
      query: 'is:unresolved',
      sort: 'freq',
      limit: 5
    };
  }
}

// Helper function to format Sentry response data using LLM
async function formatSentryResponse(sentryData, originalQuery) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: `You are a helpful assistant that summarizes Sentry error data in a clear, concise way. 
          Format your response in markdown. Highlight important information like error counts, frequencies, and impact.
          Be brief but comprehensive. Focus on the most relevant information based on the user's query.` 
        },
        { 
          role: "user", 
          content: `The user asked: "${originalQuery}". 
          Here's the data from Sentry: ${JSON.stringify(sentryData)}. 
          Please provide a helpful summary of this information.` 
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error formatting Sentry response:', error);
    return 'I encountered an error while formatting the response data. Please try again or refine your query.';
  }
}

// Endpoint to handle chatbot queries
app.post('/api/sentry-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    // Process the natural language query to get Sentry API parameters
    const apiParams = await processNaturalLanguageQuery(query);
    
    console.log('Making Sentry API request to:', sentryApiUrl);
    console.log('With params:', apiParams);

    // Make request to Sentry API according to documentation
    const sentryResponse = await axios.get(sentryApiUrl, {
      headers: {
        'Authorization': `Bearer ${SENTRY_TOKEN}`,
      },
      params: {
        ...apiParams,
        // Remove redundant parameters as they're already in the URL
      }
    });
    
    // Format the Sentry response data using the LLM
    const formattedResponse = await formatSentryResponse(sentryResponse.data, query);
    
    res.json({ response: formattedResponse });
  } catch (error) {
    console.error('Error processing Sentry query:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      params: error.config?.params
    });
    res.status(500).json({ 
      response: 'Sorry, I had trouble retrieving data from Sentry. Please check your connection or try again later.' 
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});