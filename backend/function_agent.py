from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langchain.memory import ConversationBufferMemory
import sys
import os
import json

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nba_apis import get_player_stat, get_player_salary, search_players


# Define tools
@tool
def search_players_tool(name: str) -> str:
    """Search for NBA players by their last name. This function returns all players with the specified last name, then you should filter or highlight the specific player based on the user's full query.
    
    Args:
        name: The player's last name (e.g., 'James') or full name (e.g., 'LeBron James'). The API will search by last name only.
    """
    result = search_players(name)
    if isinstance(result, dict) and "error" in result:
        return f"Error: {result['error']}"
    return str(result)

@tool
def get_player_stat_tool(id: str, season: str) -> str:
    """Retrieve average statistics for a given NBA player based on a specific season.
    
    Args:
        id: The player's unique ID.
        season: The NBA season (e.g., 2020 for the 2019-2020 season).
    """
    result = get_player_stat(id, season)
    if isinstance(result, dict) and "error" in result:
        return f"Error: {result['error']}"
    return str(result)

@tool
def get_player_salary_tool(name: str) -> str:
    """Retrieve salary information for NBA players by their last name. Returns salary details for matching players.
    
    Args:
        name: The player's last name (e.g., 'James') or full name (e.g., 'LeBron James'). The API will search by last name only.
    """
    result = get_player_salary(name)
    if isinstance(result, dict) and "error" in result:
        return f"Error: {result['error']}"
    return str(result)


# Create the agent
tools = [
    search_players_tool, 
    get_player_stat_tool, 
    get_player_salary_tool, 
]

# Initialize conversation memory
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an NBA player information assistant that focuses exclusively on providing detailed player information. Use the available tools to retrieve and present player data efficiently.

    AVAILABLE TOOLS AND RULES:
    1. search_players_tool:
       - Purpose: Search for NBA players by their last name
       - Parameter: name (string) - The player's last name or full name
       - IMPORTANT: The search is performed by LAST NAME ONLY, even if a full name is provided
       - Example: For "LeBron James", the search will be performed using "James" only
       - You should filter or highlight the specific player from results based on the user's full query
    
    2. get_player_stat_tool:
       - Purpose: Retrieve average statistics for a given NBA player for a specific season
       - Parameters: 
         * id (string) - The player's unique ID (obtained from search_players_tool)
         * season (string) - The NBA season (e.g., 2020 for the 2019-2020 season)
       - You must have the player's ID before using this tool
       - IMPORTANT: Always clarify which season the user is looking for if they don't specify a season in their query about player stats
    
    3. get_player_salary_tool:
       - Purpose: Retrieve salary information for NBA players by their last name
       - Parameter: name (string) - The player's last name or full name
       - IMPORTANT: Similar to search_players_tool, this searches by LAST NAME ONLY
       - You should filter the results to match the specific player the user is asking about

    CORE RESPONSIBILITIES:
    1. Player Information Processing
       - Use search_players_tool() first to find players matching user queries and obtain player IDs
       - Use get_player_stat_tool() to retrieve performance statistics for specific seasons
       - Use get_player_salary_tool() to provide salary and contract information
       - Present information in a clear, organized format
       - When users ask about player stats without specifying a season, ask them which season they're interested in

    RESPONSE STRUCTURE:
    1. Player Basic Information:
       - Full name, position, team, and other identifying information
       - Present this in a clear header format

    2. Requested Information (based on query):
       - Statistics: Present key stats in a tabular format when available
       - Salary details: Clearly show salary figures with appropriate formatting
       - Career highlights: Summarize notable achievements when relevant

    3. End with a simple prompt for more specific information:
       - "Would you like to know more about this player's statistics for a specific season?"
       - "Would you like salary information for other players?"

    INFORMATION PROCESSING GUIDELINES:
    - Always remember that search_players_tool and get_player_salary_tool search by LAST NAME ONLY
    - When multiple players share a last name, clearly list all options and ask the user to specify
    - Format numbers appropriately (e.g., add commas to large salary numbers)
    - Parse and present data in a readable format rather than raw API responses
    - If multiple players match a query, list options clearly with identifying details
    - Always get the player ID from search_players_tool first before using get_player_stat_tool
    - If a user asks about player stats without specifying which season, ask them "Which NBA season would you like to see stats for? For example, 2023 represents the 2022-2023 season."
    
    USE CHAT HISTORY:
    - Remember previous exchanges with the user to maintain context
    - Reference previous information discussed when appropriate
    - If the user refers to "he", "him", "his", "she", "her", "they", "them" or "that player" without naming a player, use the chat history to determine who they're referring to
    - If the user asks follow-up questions about a previously mentioned player, use that context without asking them to repeat the player's name
    """),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Create the agent and executor
llm = ChatOpenAI(temperature=0, model="gpt-4")
agent = create_openai_functions_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, memory=memory)

def process_user_message(message):
    """
    Process a user message through the NBA player information assistant.
    
    Args:
        message: The user's input message/query
        
    Returns:
        The agent's response as a string
    """
    try:
        context = {
            "input": message
        }
        response = agent_executor.invoke(context)
        return response["output"]
    except Exception as e:
        return f"An error occurred: {str(e)}"

def agent_function_calling(user_query):
    # Use the provided query directly instead of asking for input
    response = process_user_message(user_query)
    print("\nAssistant:", response)
    print("\n" + "-"*50 + "\n")
    return response

def clear_function_agent_history():
    """
    Clear the agent's conversation history.
    """
    global memory
    memory.clear()
    return "Chat history cleared"

# user_query = "What is Lebron James's Points per game"
# print(function_calling(user_query))