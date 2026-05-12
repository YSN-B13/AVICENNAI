from flask import Flask, render_template, request, jsonify, Response
import google.generativeai as genai
import json
import os
import base64
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Configure Gemini API
genai.configure(api_key=app.config['GEMINI_API_KEY'])

# Medical assistant system prompt
SYSTEM_PROMPT = """Tu es AvicennAI, un assistant médical intelligent créé par AI Solution Morocco. 
Tu es nommé en l'honneur d'Ibn Sina (Avicenne), le célèbre médecin et philosophe persan.

Tes responsabilités:
- Fournir des informations médicales générales et éducatives
- Aider à comprendre les symptômes et conditions médicales
- Suggérer quand consulter un professionnel de santé
- Analyser les images médicales (radiographies, IRM, scans) si fournies

Important:
- Toujours rappeler que tes conseils ne remplacent pas un avis médical professionnel
- Être empathique et rassurant
- Répondre en français
- Être précis et informatif tout en restant accessible

Tu peux analyser les images médicales comme les radiographies, IRM et scans pour fournir des observations préliminaires."""


def create_gemini_model():
    """Create and return Gemini model instance"""
    return genai.GenerativeModel(
        model_name='gemini-3-flash-preview',
        system_instruction=SYSTEM_PROMPT
    )


def process_message_content(content):
    """Process message content to Gemini format"""
    if isinstance(content, str):
        return content
    
    # Handle multimodal content (text + image)
    parts = []
    for item in content:
        if item.get('type') == 'text':
            parts.append(item.get('text', ''))
        elif item.get('type') == 'image_url':
            image_url = item.get('image_url', {}).get('url', '')
            if image_url.startswith('data:'):
                # Extract base64 data from data URL
                try:
                    header, base64_data = image_url.split(',', 1)
                    mime_type = header.split(':')[1].split(';')[0]
                    image_bytes = base64.b64decode(base64_data)
                    parts.append({
                        'mime_type': mime_type,
                        'data': base64_data
                    })
                except Exception as e:
                    print(f"Error processing image: {e}")
    return parts


def stream_chat_response(messages):
    """Stream chat responses from Gemini API"""
    try:
        model = create_gemini_model()
        
        # Build conversation history for Gemini
        gemini_history = []
        current_message = None
        
        for msg in messages:
            role = 'user' if msg['role'] == 'user' else 'model'
            content = process_message_content(msg['content'])
            
            if msg == messages[-1]:
                # Last message is the current prompt
                current_message = content
            else:
                gemini_history.append({
                    'role': role,
                    'parts': [content] if isinstance(content, str) else content
                })
        
        # Start chat with history
        chat = model.start_chat(history=gemini_history)
        
        # Stream the response
        if isinstance(current_message, list):
            # Multimodal message
            response = chat.send_message(current_message, stream=True)
        else:
            response = chat.send_message(current_message or '', stream=True)
        
        for chunk in response:
            if chunk.text:
                # Format as SSE with OpenAI-compatible structure for frontend
                data = {
                    'choices': [{
                        'delta': {
                            'content': chunk.text
                        }
                    }]
                }
                yield f"data: {json.dumps(data)}\n\n"
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        print(f"Gemini API error: {e}")
        error_data = {
            'choices': [{
                'delta': {
                    'content': f"Désolé, une erreur s'est produite: {str(e)}"
                }
            }]
        }
        yield f"data: {json.dumps(error_data)}\n\n"
        yield "data: [DONE]\n\n"


@app.route('/')
def index():
    """Main chat page with welcome screen"""
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages with streaming response"""
    data = request.get_json()
    messages = data.get('messages', [])
    
    return Response(
        stream_chat_response(messages),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


@app.errorhandler(404)
def not_found(error):
    """404 error page"""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)
