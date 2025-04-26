from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import tool
from langchain.memory import ConversationBufferMemory
import sys
import os
import json
from dotenv import load_dotenv

# Import budget configuration
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.budget_config import DEFAULT_BUDGET, MIN_BUDGET

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set. Please set it in your .env file.")

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from user_budget import collection, get_top_5_players_from_rank, calculate_remaining_budget

@tool
def convert_player_to_button_format(player_data) -> str:
    """
    Convert a single player data to a button format with player name and salary data for budget calculations.
    
    Args:
        player_data: A dictionary containing player information
    
    Returns:
        A JSON string formatted as a button with player name and salary information
    """
    try:
        # If input is a JSON string, parse it
        if isinstance(player_data, str):
            player_data = json.loads(player_data)
        
        # Create button format for a single player
        button_data = {
            "text": player_data.get("name", ""),
            "salary": player_data.get("salary", 0),
            "rank": player_data.get("rank", ""),
            "action": "add_player"
        }
        
        return json.dumps(button_data)
    except Exception as e:
        return json.dumps({"error": f"Error formatting button: {str(e)}"})


@tool
def get_five_players_salary_tool(rank) -> str:
    """
    Get five recommended players based on the current rank. The starting rank is 1
    
    Args:
        rank: The user's remaining budget for player selection
    
    Returns:
        A JSON string containing five recommended players with their salaries, ranks, and other information
    """
    players = get_top_5_players_from_rank(rank)
    
    # Create the JSON response structure
    player_list = []
    for player in players:
        # Extract salary as a number (removing $, M, and commas)
        salary_str = player.get('2024/25', '0').replace('$', '').replace('M', '').replace(',', '')
        try:
            salary = float(salary_str)
        except ValueError:
            salary = 0
            
        player_info = {
            "name": player.get('name', ''),
            "salary": salary,
            "rank": player.get('rank', '')
        }
        player_list.append(player_info)
    
    response_data = {
        "message": "Based on your budget, here are the recommended players:",
        "players": player_list
    }
    
    # Convert the dictionary to a JSON string
    return json.dumps(response_data, ensure_ascii=False)


@tool
def calculate_remaining_budget_tool(current_budget: float = DEFAULT_BUDGET, picked_budget: float = 0) -> str:
    """
    Calculate remaining budget.
    
    Args:
        current_budget: The current available budget, defaults to the configured DEFAULT_BUDGET
        player_salary: The salary of the player being selected, defaults to 0 if not selecting a player
    
    Returns:
        A string containing the updated budget
    """
    # Force a minimum budget if the provided budget is unreasonably small
    if current_budget < MIN_BUDGET:  # If less than minimum budget, use the default
        current_budget = DEFAULT_BUDGET
        
    remaining_budget = calculate_remaining_budget(current_budget, picked_budget)
    return f"Updated budget: ${remaining_budget:,}"


@tool
def get_next_available_rank(current_budget, current_rank=1) -> int:
    """
    Find the next available player rank based on the current budget.

    Args:
        current_budget (float): The current available budget
        current_rank (int, optional): The starting rank to search from. Defaults to 1.

    Returns:
        int: The next rank number where at least one player's salary is within budget
    """
    try:
        while True:
            rank_str = f"{current_rank}."
            players = collection.find(
                {"rank": rank_str},
                {"_id": 0, "2024/25": 1}
            )

            # Convert salaries to float and filter out missing/bad data
            salaries = []
            for player in players:
                salary_str = player.get("2024/25", "").replace("$", "").replace("M", "").replace(",", "")
                try:
                    salary = float(salary_str)
                    salaries.append(salary)
                except ValueError:
                    continue

            if salaries and min(salaries) <= current_budget:
                return current_rank

            current_rank += 1

    except Exception as e:
        print(f"Error finding next available rank: {str(e)}")
        return 1


# Create the tools list
tools = [
    get_five_players_salary_tool,
    calculate_remaining_budget_tool,
    get_next_available_rank,
    convert_player_to_button_format
]

# Create consistent memory configuration
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an NBA team-building assistant that helps users build a team within their budget.
    
    ONLY answer questions related to team building and player recommendations. For ANY other questions (like player stats, news, game information, or general NBA questions), politely tell the user to use the other agent option instead.
    
    When a user asks for player recommendations, ALWAYS follow these steps in order:
    1. First check if the user mentioned their budget in their question. If they did, use that budget value.
       - If the user didn't specify a budget, use calculate_remaining_budget_tool without specifying a budget to get the default budget.
       - The system will automatically use the configured DEFAULT_BUDGET.
    2. Then use get_next_available_rank to find the next available rank based on the budget
    3. Use get_five_players_salary_tool to get five player recommendations
    4. For the five player recommendations, iterate through each player in the list and use convert_player_to_button_format on EACH player individually to create individual buttons
    
    When a user asks for a specific player, use convert_player_to_button_format directly on that single player's data without iteration.
    
    NEVER skip steps or change their order. Always give clear explanations to the user about what you're doing.
    
    Sample response for non-team building questions:
    "I'm your team building assistant and can only help with player recommendations based on your budget. For questions about player stats, news, or other NBA information, please use the other agent option."
    """),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Create the agent and executor with updated memory approach
llm = ChatOpenAI(temperature=0, model="gpt-4")
agent = create_openai_functions_agent(llm, tools, prompt)

# Use the memory with consistent configuration
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
        # Pass only the input message as expected by the executor
        response = agent_executor.invoke({"input": message})
        return response["output"]
    except Exception as e:
        return f"An error occurred: {str(e)}"

def agent_function_calling(user_query):
    # Use the provided query directly instead of asking for input
    response = process_user_message(user_query)
    print("\nAssistant:", response)
    print("\n" + "-"*50 + "\n")
    return response



def clear_team_agent_history():
    """
    Clear the agent's conversation history.
    """
    global memory
    memory.clear()
    return "Chat history cleared"




