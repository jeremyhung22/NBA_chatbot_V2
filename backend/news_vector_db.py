import json
import os
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
import uuid

# Load environment variables from .env file
load_dotenv()

with open("./web_scrape/news_data.json", "r", encoding="utf-8") as f:
    news_data = json.load(f)

def main():
    # Reduce chunk size and overlap
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=50, 
        separators=["\n\n", "\n", ". ", "! ", "? ", ", "]
        )
    documents = []
    for article in news_data:
        chunks = splitter.create_documents(
            [article["Content"]],
            metadatas=[{
                "title": article["Title"],
                "url": article["URL"],
                "date": article["Date"],
                "news_id" : article["news_id"]

            }]
        )
        documents.extend(chunks)

    # Ensure OPENAI_API_KEY is set
    openai_api_key = os.getenv('OPENAI_API_KEY')
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set.")
        
    embedding = OpenAIEmbeddings(api_key=openai_api_key)

    # Set Pinecone environment variables
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY environment variable is not set.")
    os.environ["PINECONE_API_KEY"] = PINECONE_API_KEY

    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index_name = "nba-news-yahoo"

    # Create index if it doesn't exist
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=1536,  # OpenAI embeddings dimension
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"  # adjust region as needed
            )
        )

    # Get index
    index = pc.Index(index_name)

    # Create vector store
    vectorstore = PineconeVectorStore(
        index=index,
        embedding=embedding,
        text_key="text"
    )

    # Add documents in batches
    BATCH_SIZE = 100
    for i in range(0, len(documents), BATCH_SIZE):
        batch = documents[i:i + BATCH_SIZE]
        vectorstore.add_documents(batch)
        print(f"Added batch {i//BATCH_SIZE + 1} of {(len(documents) + BATCH_SIZE - 1)//BATCH_SIZE}")

    return

if __name__ == "__main__":
    main()