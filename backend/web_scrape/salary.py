import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import json

def getSalary():
    url = 'https://hoopshype.com/salaries/players.html'
    r = requests.get(url)
    web_content = r.text
    soup = BeautifulSoup(web_content, "html.parser")
    salary_table = soup.find('table')
        
    players = []
    for row in salary_table.find("tbody").find_all("tr"):
        cols = row.find_all("td")
        player_data = {
            "rank": cols[0].text.strip(),
            "name": cols[1].text.strip(),
            "2024/25": cols[2].text.strip(),
            "2025/26": cols[3].text.strip(),
            "2026/27": cols[4].text.strip(),
            "2027/28": cols[5].text.strip(),
        }
        players.append(player_data)

    return players

playerSalary = getSalary()

# with open("salary_data.json", "w", encoding="utf-8") as f:
#     json.dump(playerSalary, f, ensure_ascii=False, indent=2)


# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")  # Adjust if using a cloud DB
db = client["nba_salaries"]
collection = db["players"]

# Insert data
collection.insert_many(playerSalary)
print("Data saved to MongoDB!")