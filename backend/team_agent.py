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
    Get five recommended NBA players based on the specified rank.
    
    Args:
        rank: The specific player rank to start recommendations from
    
    Returns:
        A JSON string containing five real NBA players with their salaries, ranks, and other information
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
            "rank": player.get('rank', ''),
            "formatted_salary": player.get('2024/25', '$0') 
        }
        player_list.append(player_info)
    
    response_data = {
        "message": f"Based on your budget, here are REAL NBA players from rank {rank}:",
        "recommended_rank": rank,
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


@tool
def check_budget_strategy(current_budget, team_size=0, target_team_size=8) -> str:
    """
    Check budget strategy and recommend appropriate player ranks.
    
    Args:
        current_budget (float): Current remaining budget
        team_size (int): Current number of players on team
        target_team_size (int): Target team size (default 8)
    
    Returns:
        str: Budget strategy with team completion, budget percentages, and rank recommendation
    """
    try:
        # Calculate key metrics
        players_needed = target_team_size - team_size
        team_completion_percentage = (team_size / target_team_size) * 100
        budget_percentage_remaining = (current_budget / DEFAULT_BUDGET) * 100
        budget_percentage_used = 100 - budget_percentage_remaining
        
        # Team and budget status summary
        team_status = f"Team: {team_size}/{target_team_size} players ({team_completion_percentage:.1f}%)"
        budget_status = f"Budget: ${current_budget:,.0f} remaining ({budget_percentage_remaining:.1f}%)"
        
        # If team is complete, return simple message
        if players_needed <= 0:
            return f"{team_status}, {budget_status}. Your team is complete."
        
        # Calculate average budget per remaining player
        avg_budget_per_player = current_budget / players_needed if players_needed > 0 else 0
        
        # Determine appropriate rank and budget tier
        if current_budget < 20000000:  # Less than $20M
            appropriate_rank = 401
            budget_tier = "very_limited"
            rank_range = "401-609"
        elif current_budget < 40000000:  # $20M to $40M
            appropriate_rank = 201
            budget_tier = "limited"
            rank_range = "201-400"
        elif current_budget < 80000000:  # $40M to $80M
            appropriate_rank = 101 
            budget_tier = "moderate"
            rank_range = "101-200"
        elif current_budget < 160000000:  # $80M to $160M
            appropriate_rank = 31
            budget_tier = "good"
            rank_range = "31-100"
        else:  # $160M or more
            appropriate_rank = 1
            budget_tier = "excellent"
            rank_range = "1-30"
        
        # Check for budget imbalance
        budget_imbalance = budget_percentage_used > (team_completion_percentage + 20)
        
        # Base summary message
        summary = f"{team_status}, {budget_status}. Budget tier: {budget_tier} (rank range: {rank_range}). Recommend rank: {appropriate_rank}."
        
        # Add warnings for special cases
        if budget_imbalance:
            return f"{summary} WARNING: Budget usage ({budget_percentage_used:.1f}%) outpacing team completion ({team_completion_percentage:.1f}%)."
        
        return summary
            
    except Exception as e:
        print(f"Error in budget strategy check: {str(e)}")
        return f"Error checking budget. Recommend rank: 101."


# Create the tools list
tools = [
    get_five_players_salary_tool,
    calculate_remaining_budget_tool,
    get_next_available_rank,
    check_budget_strategy
]

# Create consistent memory configuration
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an NBA team-building assistant. Keep responses clear and concise.

ALWAYS follow these simple steps when recommending players:

1. Check remaining budget:
   - Use calculate_remaining_budget_tool to get current budget
   - Use check_budget_strategy to analyze budget situation and get recommended rank

2. Recommend five real players:
   - ALWAYS use get_five_players_salary_tool with the rank from step 1
   
3. After a player is picked:
   - Recalculate remaining budget with the newly picked player
   - Use check_budget_strategy again to determine the next appropriate rank
   - Recommend five new players based on the updated rank

REMEMBER THESE BUDGET-BASED RECOMMENDATION RULES:
- Budget < $20M: "very_limited" tier, rank range 401-609, recommended rank = 401
- Budget < $40M: "limited" tier, rank range 201-400, recommended rank = 201
- Budget < $80M: "moderate" tier, rank range 101-200, recommended rank = 101
- Budget < $160M: "good" tier, rank range 31-100, recommended rank = 31
- Budget ≥ $160M: "excellent" tier, rank range 1-30, recommended rank = 1

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:
[five players]
Player 1: {{name}}, Rank: {{rank}}, Salary: {{formatted_salary}}
Player 2: {{name}}, Rank: {{rank}}, Salary: {{formatted_salary}}
Player 3: {{name}}, Rank: {{rank}}, Salary: {{formatted_salary}}
Player 4: {{name}}, Rank: {{rank}}, Salary: {{formatted_salary}}
Player 5: {{name}}, Rank: {{rank}}, Salary: {{formatted_salary}}

[current picked percentage]
Team: {{team_size}}/{{target_team_size}} players ({{team_completion_percentage:.1f}}%)

[current remain budget percentage]
Budget: ${{current_budget:,.0f}} remaining ({{budget_percentage_remaining:.1f}}%)

[the player salary range based on the budget]
Budget tier: {{budget_tier}} (rank range: {{rank_range}})
Recommended rank: {{appropriate_rank}}

NEVER make up player information. Always use get_five_players_salary_tool.
NEVER use [Assistant to=functions.xyz] format in your responses.
    """),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

# Create the agent and executor with updated memory approach
llm = ChatOpenAI(temperature=0, model="gpt-4")
agent = create_openai_functions_agent(llm, tools, prompt)

# Use the memory with consistent configuration
agent_executor = AgentExecutor(
    agent=agent, 
    tools=tools, 
    verbose=True, 
    memory=memory,
    handle_parsing_errors=True,  # Handle parsing errors
    max_iterations=5,  # Limit maximum iterations to prevent loops
)

def process_user_message(message):
    """
    Process a user message through the NBA player information assistant.
    
    Args:
        message: The user's input message/query
        
    Returns:
        The agent's response as a string
    """
    try:
        # Add a simple reminder to use the correct format and tools
        enhanced_message = message + "\n\nReminder: Use get_five_players_salary_tool for real player data."
        
        # Pass only the input message as expected by the executor
        response = agent_executor.invoke({"input": enhanced_message})
        
        # Get the output and clean up any function call syntax
        output = response["output"]
        if "[Assistant to=" in output or "[assistant to=" in output.lower():
            output = output.split("]")[-1].strip()
        
        # We don't need to check for "Player 1", "Player 2" format anymore as it's our desired format
        # Just check for truly made-up player patterns
        if any(pattern in output for pattern in ["Player A", "Player B", "fictitious player"]):
            output = "I need to provide real NBA player data. Let me correct that.\n\n" + output
            
        return output
    except Exception as e:
        return f"An error occurred: {str(e)}"

def agent_function_calling(user_query):
    # Get response from the agent
    response = process_user_message(user_query)
    
    # Final check for incorrect formats and made-up data
    if "[" in response and "]" in response:
        response = response.replace("[", "").replace("]", "")
    
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




