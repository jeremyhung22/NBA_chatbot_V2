from flask import Flask, request, jsonify
from pymongo import MongoClient
from llm import main_model, clear_conversation
from query import query_pinecone_and_get_response
from flask_cors import CORS
import os
from dotenv import load_dotenv
from team_agent import agent_function_calling as team_agent_function_calling
import json
from user_budget import get_five_players_within_budget, get_top_5_players_from_rank

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["nba_salaries"]
collection = db["players"]

# Get API key from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

@app.route('/')
def index():
    return "Flask server is running!"

# 👉 Endpoint for LLM response
@app.route('/api/ask', methods=['POST', 'OPTIONS'])
def handle_ask():
    if request.method == 'OPTIONS':
        # Handle the preflight OPTIONS request by returning the correct CORS headers
        response = app.make_response('')
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    try:
        data = request.json
        user_query = data.get("prompt")
        model = data.get("model")
        response_option = data.get("response_option")

        if not all([user_query, model]):
            return jsonify({"error": "Missing prompt or model"}), 400

        if not OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key not configured"}), 500

        response = main_model(user_query, response_options = response_option)
        return jsonify({"message": response}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 👉 Endpoint for team recommendations with buttons
@app.route('/api/team/recommendations', methods=['POST', 'OPTIONS'])
def team_recommendations():
    if request.method == 'OPTIONS':
        response = app.make_response('')
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    try:
        data = request.json
        user_query = data.get("prompt")
        
        if not user_query:
            return jsonify({"error": "Missing prompt"}), 400

        # Get response from team agent
        response_text = team_agent_function_calling(user_query)
        
        # Return the text response directly without trying to extract buttons
        return jsonify({
            "message": response_text,
            "buttons": []  # Empty array for backward compatibility
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 👉 Endpoint for getting players by last name (MongoDB)
@app.route('/api/players', methods=['GET'])
def get_players_by_last_name():
    last_name = request.args.get('name')
    if not last_name:
        return jsonify({"error": "Please provide a last name"}), 400

    last_name = last_name.lower()

    # Modified query to be more flexible with name matching
    players = collection.find({
        "$or": [
            # Match by last name (case insensitive)
            {"$expr": {
                "$eq": [
                    {"$toLower": {"$arrayElemAt": [{"$split": ["$name", " "]}, -1]}},
                    last_name
                ]
            }},
            # Match by full name containing the search term (case insensitive)
            {"name": {"$regex": last_name, "$options": "i"}}
        ]
    })

    players_list = [{key: value for key, value in player.items() if key != "_id"} for player in players]
    
    # Remove potential duplicates based on player name
    unique_players = {}
    for player in players_list:
        if player.get('name') not in unique_players:
            unique_players[player.get('name')] = player
    
    # Convert back to list
    final_players_list = list(unique_players.values())

    if final_players_list:
        return jsonify(final_players_list), 200
    else:
        return jsonify({"error": "No players found with the provided last name"}), 404

# 👉 Endpoint for clearing chat history
@app.route('/api/clear', methods=['POST'])
def clear_history():
    clear_conversation()
    return jsonify({"message": "History cleared successfully"})

# 👉 Endpoint for getting NBA news
@app.route('/api/news', methods=['POST'])
def get_news():
    try:
        # Get data from JSON body
        data = request.json
        query = data.get('query', '')
        limit = int(data.get('limit', 5))
        
        # Get news using the query function
        news_content = query_pinecone_and_get_response(query=query, k=limit)
        
        return jsonify({
            "status": "success",
            "data": {
                "news": news_content
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/available-players', methods=['GET'])
def available_players():
    """
    Returns the top 5 players based on rank or budget constraints.
    """
    try:
        # Parse query parameters
        budget_param = request.args.get('budget')
        rank_param = request.args.get('rank')
        
        # Debug logging
        print(f"DEBUG: available-players endpoint called with params - rank: {rank_param}, budget: {budget_param}")
        
        players = []
        
        # Priority: 1. Rank, 2. Budget
        if rank_param and rank_param.isdigit():
            # Get players by specific rank
            rank = int(rank_param)
            print(f"DEBUG: Using rank-based search with rank={rank}")
            players = get_top_5_players_from_rank(rank)
            print(f"DEBUG: Found {len(players)} players from rank {rank}")
        else:
            # Use budget-based logic (existing functionality)
            current_budget = int(budget_param) if budget_param else None
            print(f"DEBUG: Using budget-based search with budget={current_budget}")
            
            # Get five players using the function with the current budget
            if current_budget is not None:
                players = get_five_players_within_budget(initial_budget=current_budget, picked_budget=0, start_rank=1)
            else:
                players = get_five_players_within_budget()
            print(f"DEBUG: Found {len(players)} players using budget search")
        
        # Format the player data for frontend
        player_data = []
        for player in players:
            player_data.append({
                'name': player.get('name', 'Unknown Player'),
                'rank': player.get('rank', 'N/A'),
                'salary': player.get('2024/25', '$0')
            })
        
        print(f"DEBUG: Returning {len(player_data)} players to frontend")
        return jsonify(player_data)
    except Exception as e:
        print(f"ERROR: Exception in available-players: {str(e)}")
        return jsonify([
            {"name": "LeBron James", "rank": "1.", "salary": "$47,600,000"},
            {"name": "Stephen Curry", "rank": "2.", "salary": "$55,760,000"},
            {"name": "Kevin Durant", "rank": "3.", "salary": "$51,200,000"},
            {"name": "Giannis Antetokounmpo", "rank": "4.", "salary": "$48,800,000"},
            {"name": "Nikola Jokic", "rank": "5.", "salary": "$50,200,000"}
        ]), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
