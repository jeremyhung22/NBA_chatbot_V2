# query.py
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
import json
from openai import OpenAI

load_dotenv()

def query_pinecone_and_get_response(query, k=5):
    """Get relevant news articles based on query"""
    
    with open("web_scrape/news_data.json", "r", encoding="utf-8") as f:
        news_json = json.load(f)
    news_dict = {item["news_id"]: item["Content"] for item in news_json}
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    embedding = OpenAIEmbeddings(api_key=openai_api_key)
    pc = Pinecone(api_key=pinecone_api_key)
    index_name = "nba-news-yahoo"
    index = pc.Index(index_name)
    vectorstore = PineconeVectorStore(index=index, embedding=embedding, text_key="text")
    retriever = vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": k})

    results = retriever.invoke(query)
    top2_news_ids = set([doc.metadata["news_id"] for doc in results[:2]])
    processed_news_ids = set()

    context = ""
    for i, doc in enumerate(results):
        news_id = doc.metadata["news_id"]
        
        # Skip if we've already processed this news_id
        if news_id in processed_news_ids:
            continue
            
        processed_news_ids.add(news_id)  # Mark as processed
        if news_id in top2_news_ids:
            full_news = news_dict.get(news_id)
            if full_news:
                context += f"【Source{i+1}】\nTitle：{doc.metadata['title']}\nDate：{doc.metadata['date']}\nLink：{doc.metadata['url']}\ncontent：{full_news}\n\n"
        else:
            context += f"【Source{i+1}】\nTitle：{doc.metadata['title']}\nDate：{doc.metadata['date']}\nLink：{doc.metadata['url']}\ncontent：{doc.page_content}\n\n"

    return context




