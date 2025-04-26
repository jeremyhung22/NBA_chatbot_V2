from pymongo import MongoClient
# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["nba_salaries"]
collection = db["players"]

def get_top_5_players_from_rank(rank):
    print("calling function get_top_5_players_from_rank")
    rank_range = [f"{i}." for i in range(rank, rank + 6)]
    players = collection.find(
        {"rank": {"$in": rank_range}},
        {"_id": 0, "rank": 1, "2024/25": 1, "name": 1}
    )

    return list(players)[:5]

def calculate_remaining_budget(current_budget, picked_budget):
    """
    Calculate the remaining budget after player selections.
    
    Args:
        current_budget: The initial or current budget
        picked_budget: The salary of the player being selected
    
    Returns:
        int: The remaining budget after subtracting the player's salary
    """
    try:
        print("calling function calculate_remaining_budget")
        # Ensure values are valid numbers
        current_budget = int(current_budget)
        picked_budget = int(picked_budget)
        
        # Calculate remaining budget
        remaining_budget = current_budget - picked_budget
        
        # Ensure budget doesn't go negative
        if remaining_budget < 0:
            return 0
            
        return remaining_budget
    except Exception as e:
        print(f"Error calculating budget: {str(e)}")
        return current_budget  # Return original budget in case of error


def get_next_available_rank(current_budget, current_rank):
    """
    Find the next available player rank based on the current budget.

    Args:
        current_budget_amount (float): The current available budget
        current_rank (int): The starting rank to search from

    Returns:
        int: The next rank number where at least one player's salary is within budget
    """
    try:
        while True:
            print("calling function get_next_available_rank")
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



