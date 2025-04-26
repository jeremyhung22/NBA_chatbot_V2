import json
from openai import OpenAI
#from nba_apis import search_players, get_player_stat, get_player_salary
from prompt import functions_system_prompt, main_system_prompt, tools
import os
from dotenv import load_dotenv
from query import query_pinecone_and_get_response
from langchain_openai import OpenAIEmbeddings
from pinecone import Pinecone
from langchain_pinecone import PineconeVectorStore
from function_agent import agent_function_calling

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

# Initialize global conversation histories
function_model_conversation_history = [
    {"role": "system", "content": functions_system_prompt}
]

main_model_conversation_history = [
    {"role": "system", "content": main_system_prompt("player_details")}
]

MAX_TURNS = 20
MAX_HISTORY = 10  # Keep last 10 exchanges

response_options = ["player_details", "news", "recommendation"]

##response_options
def main_model(user_query, response_options = "player_details"):
    global main_model_conversation_history
    client = OpenAI(api_key=api_key)
    
    # Update system prompt if response option changed
    if main_model_conversation_history[0]["content"] != main_system_prompt(response_options):
        main_model_conversation_history[0] = {"role": "system", "content": main_system_prompt(response_options)}
    
    # Add user message to conversation
    main_model_conversation_history.append({"role": "user", "content": user_query})
    
    # Manage conversation history length
    if len(main_model_conversation_history) > (MAX_HISTORY * 2 + 1):
        main_model_conversation_history = [main_model_conversation_history[0]] + main_model_conversation_history[-(MAX_HISTORY * 2):]
    print("Current response_options : ", response_options)
    if response_options == "player_details":
        # Get response from function_calling
        result = agent_function_calling(user_query)
        print(result)
        print("-"*100)
        print("-"*100)
    elif response_options == "news":
        result = query_pinecone_and_get_news(user_query)
        print(result)
        print("-"*100)
        print("-"*100)
    # Add result to conversation if it exists
    if result:
        main_model_conversation_history.append({"role": "assistant", "content": 
                                                "this is the output the first model : /n" + result})
        
        # Get final response with tool results
        final_response = client.chat.completions.create(
            model="gpt-4",
            messages=main_model_conversation_history,
            temperature=0.7
        )
        response_content = final_response.choices[0].message.content
        
        # Add assistant response to history
        main_model_conversation_history.append({"role": "assistant", "content": response_content})
        return response_content
    
    return result

# def function_calling(user_query):
#     """Handle tool calls and return results"""
#     global function_model_conversation_history
#     client = OpenAI(api_key=api_key)
#     try:
#         # Add user message to conversation history
#         function_model_conversation_history.append({"role": "user", "content": user_query})
        
#         # Manage conversation history length
#         if len(function_model_conversation_history) > (MAX_HISTORY * 2 + 1):
#             function_model_conversation_history = [function_model_conversation_history[0]] + function_model_conversation_history[-(MAX_HISTORY * 2):]
        
#         # Initial API call to get tool selection
#         response = client.chat.completions.create(
#             model="gpt-4",
#             messages=function_model_conversation_history,
#             tools=tools,
#         )
        
#         # Process tool calls if any
#         assistant_message = {"role": "assistant", "content": response.choices[0].message.content}
#         if response.choices[0].message.tool_calls:
#             assistant_message["tool_calls"] = [
#                 {
#                     "id": tool.id,
#                     "type": "function",
#                     "function": {"name": tool.function.name, "arguments": tool.function.arguments}
#                 } for tool in response.choices[0].message.tool_calls
#             ]
#         function_model_conversation_history.append(assistant_message)

#         # Process tool calls if any
#         tool_responses = []
#         if response.choices[0].message.tool_calls:
#             for tool in response.choices[0].message.tool_calls:
#                 if not hasattr(tool, 'function') or not hasattr(tool, 'id'):
#                     continue
                
#                 tool_name = tool.function.name
#                 try:
#                     tool_args = json.loads(tool.function.arguments)
#                 except json.JSONDecodeError:
#                     continue

#                 tool_response = None
#                 if tool_name == "search_players":
#                     print("calling function search_players")
#                     print("---------------------------------------------")
#                     player_name = tool_args.get("name")
#                     if player_name:
#                         player_data = search_players(player_name)
#                         if player_data is not None:
#                             tool_response = {
#                                 "role": "tool",
#                                 "tool_call_id": tool.id,
#                                 "content": json.dumps(player_data)
#                             }

#                 elif tool_name == "get_player_stat":
#                     print("calling function get_player_stat")
#                     print("---------------------------------------------")
#                     player_id = str(tool_args.get("id") or tool_args.get("player_id"))
#                     season = tool_args.get("season")
#                     if player_id and season:
#                         stats_data = get_player_stat(player_id, season)
#                         if stats_data is not None:
#                             tool_response = {
#                                 "role": "tool",
#                                 "tool_call_id": tool.id,
#                                 "content": json.dumps(stats_data)
#                             }

#                 elif tool_name == "get_player_salary":
#                     print("calling function get_player_salary")
#                     print("---------------------------------------------")
#                     player_name = tool_args.get("name")
#                     if player_name:
#                         player_data = get_player_salary(player_name)
#                         if player_data is not None:
#                             tool_response = {
#                                 "role": "tool",
#                                 "tool_call_id": tool.id,
#                                 "content": json.dumps(player_data)
#                             }

#                 if tool_response:
#                     tool_responses.append(tool_response)
#                     function_model_conversation_history.append(tool_response)

#         # Make a final call to process all tool outputs
#         final_response = client.chat.completions.create(
#             model="gpt-4",
#             messages=function_model_conversation_history,
#             temperature=0.7
#         )
        
#         response_content = final_response.choices[0].message.content
#         # Add final assistant response to history
#         function_model_conversation_history.append({"role": "assistant", "content": response_content})
#         return response_content

#     except Exception as e:
#         print(f"Error in ask_llm: {e}")
#         return f"I encountered an error while processing your request: {str(e)}"
    

def query_pinecone_and_get_news(query, k=5):
    """Get relevant news articles based on query"""
    print("calling function news data")
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
    print("get response from news data")
    return context






def clear_conversation():
    global function_model_conversation_history, main_model_conversation_history
    
    # # Reset function model conversation history
    # function_model_conversation_history = [
    #     {"role": "system", "content": functions_system_prompt}
    # ]
    
    # Reset main model conversation history
    main_model_conversation_history = [
        {"role": "system", "content": main_system_prompt("player_details")}
    ]
    
    # Clear agent conversation history
    from function_agent import clear_function_agent_history
    clear_function_agent_history()

    return "Chat history cleared"






