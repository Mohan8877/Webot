"""
RAG Chatbot Module
Handles chat generation using Retrieval-Augmented Generation with Google Gemini.
"""

import os
from typing import List, Optional
import google.generativeai as genai


class RAGChatbot:
    """Handles chat generation using RAG with Gemini AI."""
    
    def __init__(self):
        # Configure Gemini API
        api_key = os.environ.get('GOOGLE_GENERATIVE_AI_API_KEY') or os.environ.get('GEMINI_API_KEY')
        
        if not api_key:
            print("[WARNING] No Gemini API key found. Set GOOGLE_GENERATIVE_AI_API_KEY environment variable.")
            self.model = None
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            print("[RAG] Initialized Gemini model: gemini-1.5-flash")
        
        # Language-specific prompts
        self.language_instructions = {
            'en': "Respond in English.",
            'hi': "हिंदी में जवाब दें। (Respond in Hindi using Devanagari script.)",
            'te': "తెలుగులో సమాధానం ఇవ్వండి। (Respond in Telugu using Telugu script.)"
        }
        
        self.no_info_responses = {
            'en': "I could not find this information on the website.",
            'hi': "मुझे वेबसाइट पर यह जानकारी नहीं मिली।",
            'te': "వెబ్‌సైట్‌లో ఈ సమాచారం కనుగొనలేకపోయాను."
        }
    
    def _create_prompt(
        self,
        question: str,
        context_chunks: List[str],
        language: str,
        website_url: str
    ) -> str:
        """Create the RAG prompt for Gemini."""
        
        context = "\n\n---\n\n".join(context_chunks)
        language_instruction = self.language_instructions.get(language, self.language_instructions['en'])
        
        prompt = f"""You are a helpful AI assistant that answers questions ONLY based on the provided website content. 

STRICT RULES:
1. ONLY use information from the provided context below
2. Do NOT use any external knowledge or make assumptions
3. If the answer is not found in the context, respond with: "{self.no_info_responses.get(language, self.no_info_responses['en'])}"
4. Be concise and helpful
5. {language_instruction}
6. Cite the website when relevant: {website_url}

WEBSITE CONTENT:
{context}

USER QUESTION:
{question}

ANSWER:"""
        
        return prompt
    
    def generate_answer(
        self,
        question: str,
        context_chunks: List[str],
        language: str = 'en',
        website_url: str = ''
    ) -> str:
        """
        Generate an answer using RAG.
        
        Args:
            question: User's question
            context_chunks: Relevant content chunks from the website
            language: Response language ('en', 'hi', 'te')
            website_url: URL of the source website
        
        Returns:
            Generated answer string
        """
        
        if not self.model:
            return self._fallback_response(question, context_chunks, language)
        
        if not context_chunks:
            return self.no_info_responses.get(language, self.no_info_responses['en'])
        
        try:
            # Create prompt
            prompt = self._create_prompt(question, context_chunks, language, website_url)
            
            # Generate response
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.3,  # Lower temperature for more focused answers
                    top_p=0.8,
                    top_k=40,
                    max_output_tokens=1024,
                )
            )
            
            if response.text:
                return response.text.strip()
            else:
                return self.no_info_responses.get(language, self.no_info_responses['en'])
                
        except Exception as e:
            print(f"[RAG] Error generating response: {str(e)}")
            return self._fallback_response(question, context_chunks, language)
    
    def _fallback_response(
        self,
        question: str,
        context_chunks: List[str],
        language: str
    ) -> str:
        """
        Fallback response when Gemini is not available.
        Returns relevant context chunks as the answer.
        """
        if not context_chunks:
            return self.no_info_responses.get(language, self.no_info_responses['en'])
        
        # Return the most relevant chunk as a simple response
        prefixes = {
            'en': "Based on the website content:\n\n",
            'hi': "वेबसाइट की सामग्री के आधार पर:\n\n",
            'te': "వెబ్‌సైట్ కంటెంట్ ఆధారంగా:\n\n"
        }
        
        prefix = prefixes.get(language, prefixes['en'])
        return prefix + context_chunks[0][:500] + "..."
