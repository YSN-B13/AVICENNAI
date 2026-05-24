from flask import Flask, render_template, request, Response, jsonify
import google.generativeai as genai
from pathlib import Path
from langchain.agents import create_agent
from config.config import Config
from config.models import db, Drug, SideEffectReport
from routes.ai_agent import stream_chat_response
from routes.SideEffectsTrackerAgent import local_tools, get_mcp_tools
import routes.SideEffectsTrackerAgent as tracker_module
from dotenv import load_dotenv
import asyncio
import yaml
import sys
load_dotenv()

app = Flask(__name__)
app.config.from_object(Config)
genai.configure(api_key=app.config['GEMINI_API_KEY'])


db.init_app(app)
tracker_module.flask_app = app

with app.app_context():
    db.create_all()

async def load_tools():
    mcp_tools = await get_mcp_tools()
    return local_tools + mcp_tools
all_tools = asyncio.run(load_tools())

llm_agent = create_agent(
    model="google_genai:gemini-3.5-flash",
    tools=all_tools,
    system_prompt="""
        You are a helpful assistant for finding side effects of drugs.

        When using Slack always send messages to the channel #all-neuralfinance.
        If you find new information not in DB, notify via Slack.

        Procedure:
        1. List drugs in DB
        2. If exists, list side effects
        3. Fetch new side effects
        4. Store new ones if missing
        5. Notify user via Slack"""
)


def load_prompts(path = "prompts.yaml"):
    with open(Path(path), "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

prompts = load_prompts()
SYSTEM_PROMPT = (
    f"{prompts['medical_assistant']['system']}\n\n"
    f"{prompts['medical_assistant']['disclaimer']}\n\n"
    f"{prompts['medical_assistant']['image_analysis_note']}"
)

model = genai.GenerativeModel(
        model_name='gemini-3-flash-preview',
        system_instruction=SYSTEM_PROMPT
)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    messages = data.get('messages', [])
    
    return Response(
        stream_chat_response(messages, model),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        }
    )


@app.route('/side-effects')
def Sideeffects():
    drugs = Drug.query.all()
    return render_template("side_effects.html", drugs=drugs)


@app.route("/query", methods=["POST"])
def query():
    user_query = request.json.get("query", "")

    # FIX: correct input format for most modern LangChain agents
    result = asyncio.run(
        llm_agent.ainvoke({
            "messages": [{"role": "user", "content": user_query}]
        })
    )

    response = result["messages"][-1]["content"]

    return jsonify({"response": response})

@app.errorhandler(404)
def not_found(error):
    """404 error page"""
    return render_template('404.html'), 404


if __name__ == '__main__':
    app.run(debug=True, port=5000)

