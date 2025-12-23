# Webot - Flask Backend

A Flask-based backend that powers the Website-to-Chatbot Converter using RAG (Retrieval-Augmented Generation) with Google Gemini AI.

## Features

- **Web Scraping**: Intelligent scraping of public websites with robots.txt compliance
- **RAG System**: Retrieval-Augmented Generation for accurate answers
- **Multi-Language Support**: English, Hindi, and Telugu
- **Vector Search**: FAISS-based similarity search for relevant content retrieval
- **Google Gemini Integration**: Powered by Gemini 1.5 Flash for fast responses

## Prerequisites

- Python 3.9+
- Google Gemini API Key

## Installation

1. Clone the repository and navigate to the backend folder:
```bash
cd scripts/flask_backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your GOOGLE_GENERATIVE_AI_API_KEY
```

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

### Scrape Website
```
POST /scrape-website
Content-Type: application/json

{
    "url": "https://example.com",
    "userId": "user123"
}
```

### Train Website (Create Embeddings)
```
POST /train-website
Content-Type: application/json

{
    "url": "https://example.com",
    "userId": "user123"
}
```

### Chat
```
POST /chat
Content-Type: application/json

{
    "question": "What services do you offer?",
    "url": "https://example.com",
    "userId": "user123",
    "language": "en"  // en, hi, or te
}
```

### Get Status
```
GET /status/<url_hash>
```

## Deployment

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your repository
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `gunicorn app:app`
5. Add environment variable: `GOOGLE_GENERATIVE_AI_API_KEY`

### Deploy to Railway

1. Create a new project on Railway
2. Connect your repository
3. Add environment variables
4. Railway will auto-detect Flask and deploy

### Deploy to Heroku

1. Create a `Procfile`:
```
web: gunicorn app:app
```

2. Deploy using Heroku CLI or GitHub integration

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google Gemini API key | Yes |
| `PORT` | Server port (default: 5000) | No |
| `FLASK_DEBUG` | Enable debug mode | No |

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Next.js App    │────▶│ Flask API    │────▶│ Google      │
│  (Frontend)     │◀────│ (Backend)    │◀────│ Gemini      │
└─────────────────┘     └──────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │ FAISS        │
                        │ Vector Store │
                        └──────────────┘
```

## License

MIT License
