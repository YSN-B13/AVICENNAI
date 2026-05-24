import base64
import json

def process_message_content(content):
    if isinstance(content, str):
        return content
    
    parts = []
    for item in content:
        if item.get('type') == 'text':
            parts.append(item.get('text', ''))
        
        elif item.get('type') == 'image_url':
            image_url = item.get('image_url', {}).get('url', '')
            
            if image_url.startswith('data:'):
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


def stream_chat_response(messages, model):
    try:
        gemini_history = []
        current_message = None
        
        for msg in messages:
            role = 'user' if msg['role'] == 'user' else 'model'
            content = process_message_content(msg['content'])
            
            if msg == messages[-1]:
                current_message = content
            
            else:
                gemini_history.append({
                    'role': role,
                    'parts': [content] if isinstance(content, str) else content
                })
        
        chat = model.start_chat(history=gemini_history)
        
        if isinstance(current_message, list):
            response = chat.send_message(current_message, stream=True)
        else:
            response = chat.send_message(current_message or '', stream=True)
        
        for chunk in response:
            if chunk.text:
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
