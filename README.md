# NBA Player Q&A Assistant

A GenAI-powered NBA player information and team management system that leverages advanced language models and data integration to provide comprehensive player insights, news, and team building capabilities.
![截圖 2025-04-28 下午4 01 00](https://github.com/user-attachments/assets/f28bd9ec-7fe1-4e7d-8a57-db3a30ae16b3)


## Features


- **AI-Powered Player Analysis**: Get detailed statistics and insights about NBA players using GenAI
- **Smart Team Building**: AI-assisted team creation with budget optimization
- **News Intelligence**: AI-curated NBA news with contextual understanding
- **Interactive Chat Interface**: Natural language interaction powered by GenAI
- **Real-time Data Integration**: Seamless combination of multiple data sources

## Data Sources

- **Player Details & Game Performance**: RapidAPI NBA endpoints
- **Player Salaries & News**: Web scraping from official NBA sources
- **News Articles**: Vector database for efficient retrieval and context

## AI Techniques

- **Function Calling**: Used for retrieving player details, game performance, salary information, and user budget management
- **Few-Shot Prompting**: Implemented for better context understanding and response generation
- **RAG (Retrieval-Augmented Generation)**: Applied for news article processing and contextual responses
- **Natural Language Understanding**: Advanced prompt engineering for accurate query interpretation
- **LangChain Agents**:
  - **Team Builder Agent**: Uses LangChain to process user inputs, extract parameters, and manage team building operations
  - **Player Detail Agent**: Uses LangChain for parsing user queries and converting them into structured function calls

## Project Structure

```

├── frontend/              # React-based frontend application
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── backend/              # Python-based backend server
│   ├── app.py           # Main application server
│   ├── llm.py           # Language model integration
│   ├── nba_apis.py      # RapidAPI integration
│   ├── team_agent.py    # Team management logic
│   ├── web_scrape/      # Web scraping utilities
│   └── news_vector_db.py # News article vector database
└── config/              # Configuration files
```

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- npm or yarn
- Virtual environment (recommended)
- OpenAI API key
- RapidAPI NBA API key

## Installation

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. Start the backend server:
   ```bash
   python backend/app.py
   ```

## Usage
Use the chat interface to:
   - Ask questions about NBA players (powered by GenAI)
   - Get AI-analyzed player statistics
   - Build optimized teams within budget constraints
   - Access AI-curated NBA news with context

## Technologies Used

- **Frontend**:
  - React
  - Tailwind CSS
  - Vite
  - React Markdown

- **Backend**:
  - Python
  - Flask
  - OpenAI API
  - RapidAPI NBA endpoints
  - Vector Database for news articles
  - Web scraping utilities

- **LLM**:
  - OpenAI GPT models
  - LangChain for agent implementation
  - Function calling
  - Few-shot prompting
  - RAG architecture
  - Vector embeddings

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the foundation models
- RapidAPI for NBA data access
- NBA official sources for player information
