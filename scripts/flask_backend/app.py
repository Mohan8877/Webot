"""
Website-to-Chatbot Converter - Flask Backend
Main application entry point with all API endpoints
"""

import os
import hashlib
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Import our modules
from scraper import WebScraper
from embeddings import EmbeddingManager
from rag_chat import RAGChatbot

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "https://*.vercel.app", "*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize components
scraper = WebScraper()
embedding_manager = EmbeddingManager()
chatbot = RAGChatbot()

# In-memory storage for processed websites (in production, use a database)
processed_websites = {}


def get_url_hash(url: str) -> str:
    """Generate a unique hash for a URL."""
    return hashlib.md5(url.encode()).hexdigest()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    })


@app.route('/scrape-website', methods=['POST'])
def scrape_website():
    """
    Scrape a website and extract its content.
    
    Request body:
    {
        "url": "https://example.com",
        "userId": "user123"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        url = data.get('url')
        user_id = data.get('userId', 'anonymous')
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            return jsonify({"error": "Invalid URL. Must start with http:// or https://"}), 400
        
        # Generate unique key for this URL
        url_hash = get_url_hash(url)
        
        # Scrape the website
        print(f"[SCRAPER] Starting scrape for: {url}")
        content = scraper.scrape_website(url)
        
        if not content or len(content.strip()) < 100:
            return jsonify({
                "error": "Could not extract meaningful content from the website. The page might be empty, blocked, or requires authentication."
            }), 400
        
        # Store the scraped content
        processed_websites[url_hash] = {
            "url": url,
            "user_id": user_id,
            "content": content,
            "scraped_at": datetime.utcnow().isoformat(),
            "status": "scraped"
        }
        
        print(f"[SCRAPER] Successfully scraped {len(content)} characters from {url}")
        
        return jsonify({
            "success": True,
            "message": "Website scraped successfully",
            "url": url,
            "contentLength": len(content),
            "urlHash": url_hash
        })
        
    except Exception as e:
        print(f"[ERROR] Scraping failed: {str(e)}")
        return jsonify({"error": f"Failed to scrape website: {str(e)}"}), 500


@app.route('/train-website', methods=['POST'])
def train_website():
    """
    Process scraped content and create embeddings for RAG.
    
    Request body:
    {
        "url": "https://example.com",
        "userId": "user123"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        url = data.get('url')
        user_id = data.get('userId', 'anonymous')
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        url_hash = get_url_hash(url)
        
        # Check if website was scraped
        if url_hash not in processed_websites:
            return jsonify({
                "error": "Website not found. Please scrape the website first."
            }), 404
        
        website_data = processed_websites[url_hash]
        content = website_data.get('content', '')
        
        if not content:
            return jsonify({"error": "No content found for this website"}), 400
        
        # Create embeddings and store in vector database
        print(f"[EMBEDDINGS] Processing content for: {url}")
        
        chunks = embedding_manager.chunk_text(content)
        print(f"[EMBEDDINGS] Created {len(chunks)} chunks")
        
        embedding_manager.create_index(url_hash, chunks)
        print(f"[EMBEDDINGS] Index created for {url_hash}")
        
        # Update status
        processed_websites[url_hash]["status"] = "ready"
        processed_websites[url_hash]["chunks_count"] = len(chunks)
        processed_websites[url_hash]["trained_at"] = datetime.utcnow().isoformat()
        
        return jsonify({
            "success": True,
            "message": "Website trained successfully",
            "url": url,
            "chunksCreated": len(chunks),
            "urlHash": url_hash
        })
        
    except Exception as e:
        print(f"[ERROR] Training failed: {str(e)}")
        return jsonify({"error": f"Failed to train on website: {str(e)}"}), 500


@app.route('/chat', methods=['POST'])
def chat():
    """
    Chat with the trained website content using RAG.
    
    Request body:
    {
        "question": "What services do you offer?",
        "url": "https://example.com",
        "userId": "user123",
        "language": "en"  # en, hi, or te
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        question = data.get('question')
        url = data.get('url')
        user_id = data.get('userId', 'anonymous')
        language = data.get('language', 'en')
        
        if not question:
            return jsonify({"error": "Question is required"}), 400
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        url_hash = get_url_hash(url)
        
        # Check if website is trained
        if url_hash not in processed_websites:
            return jsonify({
                "error": "Website not found. Please process the website first."
            }), 404
        
        website_data = processed_websites[url_hash]
        
        if website_data.get('status') != 'ready':
            return jsonify({
                "error": "Website is not ready. Please wait for training to complete."
            }), 400
        
        # Retrieve relevant chunks
        print(f"[RAG] Searching for: {question}")
        relevant_chunks = embedding_manager.search(url_hash, question, top_k=5)
        
        if not relevant_chunks:
            no_info_messages = {
                'en': "I could not find this information on the website.",
                'hi': "मुझे वेबसाइट पर यह जानकारी नहीं मिली।",
                'te': "వెబ్‌సైట్‌లో ఈ సమాచారం కనుగొనలేకపోయాను."
            }
            return jsonify({
                "answer": no_info_messages.get(language, no_info_messages['en']),
                "sources": [],
                "language": language
            })
        
        print(f"[RAG] Found {len(relevant_chunks)} relevant chunks")
        
        # Generate answer using Gemini
        answer = chatbot.generate_answer(
            question=question,
            context_chunks=relevant_chunks,
            language=language,
            website_url=url
        )
        
        return jsonify({
            "answer": answer,
            "sources": relevant_chunks[:3],  # Return top 3 sources
            "language": language,
            "url": url
        })
        
    except Exception as e:
        print(f"[ERROR] Chat failed: {str(e)}")
        return jsonify({"error": f"Failed to generate response: {str(e)}"}), 500


@app.route('/history/<user_id>', methods=['GET'])
def get_history(user_id: str):
    """
    Get chat history for a user.
    Note: In production, this would fetch from Firebase/database.
    """
    try:
        # This endpoint is mostly handled by Firebase in the frontend
        # This is a placeholder for any additional server-side history needs
        return jsonify({
            "message": "History is managed by Firebase on the frontend",
            "userId": user_id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/status/<url_hash>', methods=['GET'])
def get_status(url_hash: str):
    """Get the processing status of a website."""
    try:
        if url_hash not in processed_websites:
            return jsonify({"error": "Website not found"}), 404
        
        website_data = processed_websites[url_hash]
        
        return jsonify({
            "url": website_data.get('url'),
            "status": website_data.get('status'),
            "scrapedAt": website_data.get('scraped_at'),
            "trainedAt": website_data.get('trained_at'),
            "chunksCount": website_data.get('chunks_count', 0)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║     Website-to-Chatbot Converter - Flask Backend         ║
    ║                                                          ║
    ║     Running on: http://localhost:{port}                   ║
    ║     Debug mode: {debug}                                    ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
