import os
import sys
import asyncio
from dotenv import load_dotenv
from flask import Flask
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from config.models import db, Drug, SideEffectReport
import routes.SideEffectsTrackerAgent as tracker_module
from routes.SideEffectsTrackerAgent import local_tools, get_mcp_tools
load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///drugs.db'
app.config['GEMINI_API_KEY'] = os.getenv("GEMINI_API_KEY")

db.init_app(app)
tracker_module.flask_app = app

with app.app_context():
    db.create_all()

async def run_agent_test_async():
    try:
        print("⏳ Fetching remote MCP tools via Arcade Gateway...")
        mcp_tools = await get_mcp_tools()
        print(f"✅ Loaded {len(mcp_tools)} remote MCP tools.")
    except Exception as e:
        print(f"❌ Error loading MCP tools: {e}")
        mcp_tools = []

    all_tools = local_tools + mcp_tools

    if not app.config['GEMINI_API_KEY']:
        print("❌ Error: GEMINI_API_KEY is missing. Check your .env file.")
        return

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=app.config['GEMINI_API_KEY']
    )

    agent_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful assistant for finding side effects of drugs.
        When using Slack, always send messages to the channel #all-neuralnine.
        You will be given a specific drug to analyze. Process it using this workflow:
        1. Check the database using your tools to see if the drug exists and list known side effects.
        2. Search the internet using your web search tools for any updated or new side effects.
        3. Compare the findings. If you discover a brand new side effect not recorded in the database:
            - Create a new side effect report in the database.
            - Send a concise slack message outlining exclusively the new updates.
        4. Finally, return a clean summary of your findings to the user."""),
                MessagesPlaceholder(variable_name="chat_history", optional=True),
                ("human", "{input}"),
                MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    langchain_agent = create_tool_calling_agent(llm, all_tools, agent_prompt)
    agent_executor = AgentExecutor(agent=langchain_agent, tools=all_tools, verbose=True)

    test_input = {
        "input": "Please analyze the side effects for Ozempic.",
        "chat_history": []
    }

    with app.app_context():
        try:
            print("\n🚀 Starting Async Agent Execution Pipeline...\n")
            response = await agent_executor.ainvoke(test_input)
            
            print("\n✅ Execution Finished Successfully!")
            print("\n--- Final Agent Response ---")
            print(response.get("output", "No response summary generated."))

        except Exception as e:
            print(f"\n❌ Agent execution failed: {e}")

if __name__ == '__main__':
    asyncio.run(run_agent_test_async())
    print("\n🌐 Starting local Flask development server...")
    app.run(debug=True, port=5000, use_reloader=False)

