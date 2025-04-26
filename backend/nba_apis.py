import requests
import pandas as pd
from query import query_pinecone_and_get_response
api_key = "5fd4069165msh6cb1e21b7254ef5p14739ejsnbd9d3c24d49b"


def search_players(player_name):
    print("calling function search_players")
    print("---------------------------------------------")
    # Extract last name from full name
    last_name = player_name.split()[-1]
    
    url = "https://api-nba-v1.p.rapidapi.com/players"
    querystring = {"search": last_name}  # Use only last name for search
    headers = {
        "x-rapidapi-key": f"{api_key}",
        "x-rapidapi-host": "api-nba-v1.p.rapidapi.com"
    }
    
    try:
        # get response from NBA api
        response = requests.get(url, headers=headers, params=querystring)
        print("get response from search_players()")
        print("---------------------------------------------")
        print(response.json())
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API error: {response.status_code}"}
    except Exception as e:
        return {"error": f"Can't get player data: {str(e)}"}
    
def get_player_stat(id, season):
    print("calling function get_player_stat")
    print("---------------------------------------------")
    url = "https://api-nba-v1.p.rapidapi.com/players/statistics"
    querystring = {"id":id,"season":season}
    headers = {
        "x-rapidapi-key": f"{api_key}",
        "x-rapidapi-host": "api-nba-v1.p.rapidapi.com"
    }
    
    try:
        response = requests.get(url, headers=headers, params=querystring)
        print("get response from get_player_stat()")
        print("---------------------------------------------")
        data = response.json()
        if response.status_code == 200:
            df = pd.DataFrame(data['response'])
            
            # Add safer conversion with error handling
            for col in ['fgp', 'ftp', 'tpp']:
                try:
                    # Handle empty or None values
                    df[col] = df[col].fillna('0%')
                    # Handle both string and numeric values
                    df[col] = df[col].apply(lambda x: float(str(x).replace('%', '')) if isinstance(x, (str)) else float(x))
                except Exception as e:
                    print(f"Error converting {col}: {e}")
                    # Set to 0 if conversion fails
                    df[col] = 0.0
            
            averages = df[['points', 'fgm', 'fga', 'fgp', 'fta', 'ftp', 'tpm', 'tpa', 'tpp', 'offReb', 'defReb', 'totReb', 'assists', 'pFouls', 'steals', 'turnovers', 'blocks']].mean().round(2)
            print(averages)
            return averages.to_dict()
        else:
            return {"error": f"API error: {response.status_code}"}
    except Exception as e:
        return {"error": f"Can't get player detail: {str(e)}"}
    
def get_player_salary(name):
    print("calling function get_player_salary")
    print("---------------------------------------------")
    url = "http://127.0.0.1:5000/api/players"
    querystring = {"name" : name}
    try:
        # get response from NBA api
        response = requests.get(url, params=querystring)
        print("get response from get_player_salary")
        print("---------------------------------------------")
        print(response.json())
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"API error: {response.status_code}"}
    except Exception as e:
        return {"error": f"Can't get player data: {str(e)}"}