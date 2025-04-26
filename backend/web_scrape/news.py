import requests
from bs4 import BeautifulSoup
import pandas as pd
import uuid
from tqdm import tqdm


def getSportsTitle(page=1):
    base_url = f"https://sports.yahoo.com/nba/news/page/{page}/"
    news_list = []
    
    # Construct URL with page parameter
    url = f"{base_url}?page={page+1}" if page > 0 else base_url
    r = requests.get(url)
    r.raise_for_status()
    
    soup = BeautifulSoup(r.text, "html.parser")
    # Get the count of available news items
    available_items = len(soup.select(".Pos\(r\).D\(f\)"))
    news_items = soup.select(".D\(f\).Fld\(c\).Fxg\(1\).Miw\(0\) a")
    for item in news_items:
        news_id = str(uuid.uuid4())
        if len(news_list) >= available_items:
            return news_list
            
        news_list.append({
            'title': item.text.strip(),
            'link': item.get('href'),
            "news_id": news_id
        })
        
    return news_list

def getNews(url):
    try:
        r = requests.get(url)
        r.raise_for_status()
        
        soup = BeautifulSoup(r.text, "html.parser")
        date_element = soup.find('div', class_="content-timestamp")
        if date_element:
            date = date_element.find('time')
        else:
            date = None

        content = soup.find('div', class_='content-body')
        
        if content:
            paragraphs = content.find_all(['p', 'a'])
            all_text = [p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True)]
            return {
                'content': ' '.join(all_text),
                'date': date.get_text(strip=True) if date_element else None
            }
        return None
        
    except requests.RequestException as e:
        print(f"Error fetching news: {str(e)}")
        return None

col_name = ["Title", "Content", "URL", "Date", "news_id"]



news_data = []  # List to store all news items

for i in tqdm(range(50), desc="Pages"):
    news_results = getSportsTitle(page=i + 1)
    print(f"Found {len(news_results)} news items")
    for item in tqdm(news_results, desc=f"News items on page {i+1}", leave=False):
        result = getNews(item['link'])
        if result:
            news_data.append({
                "Title": item['title'],
                "Content": result['content'],
                "URL": item['link'],
                "Date": result['date'],
                "news_id": item["news_id"]
            })
        #print(result['date'] + "saved")



# Create DataFrame from collected data
output = pd.DataFrame(news_data, columns=col_name)
# Save to Excel with proper filename
output.to_excel("nba_news.xlsx", index=False)
print("Data saved to Excel file!")



import json

df = pd.read_excel("nba_news.xlsx")
news_data = df.to_dict(orient="records")
with open("news_data.json", "w", encoding="utf-8") as f:
    json.dump(news_data, f, ensure_ascii=False, indent=2)

print("json file saved")



