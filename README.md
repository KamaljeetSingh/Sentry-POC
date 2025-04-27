# Sentry AI Monitoring POC

This POC demonstrates how LLMs and GenAI can help monitor web applications better by providing a natural language interface to query Sentry error data.

## Features

- Natural language interface to query Sentry error data
- Integration with existing React application
- AI-powered interpretation of user queries
- AI-formatted responses with relevant information

## Setup Instructions

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.template` and fill in your credentials:
   - Sentry API token
   - Sentry organization slug
   - Sentry project slug
   - OpenAI API key

4. Run the development server:
   ```
   npm run dev
   ```

## Usage

1. Open your application in the browser
2. Click the "Open Error Monitor" button in the bottom right corner
3. Ask questions about your application errors, such as:
   - "What are the top errors from last week?"
   - "Show me critical issues in the past 24 hours"
   - "What's the most frequent error today?"
   - "How many unresolved errors do we have?"

## Architecture

- **Frontend**: React components for the chatbot interface
- **Backend**: Express server that handles:
  - Processing natural language queries using LLM
  - Communicating with Sentry API
  - Formatting responses using LLM

## Next Steps (Future Phases)

- Add authentication for multiple users
- Enable direct linking to Sentry issues
- Add visualization of error trends
- Implement proactive alerts based on anomaly detection
- Add ability to resolve/assign issues from the chatbot