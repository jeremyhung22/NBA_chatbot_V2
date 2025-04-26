import React, { useState, useContext } from "react";
import { askMainModel, clearHistory, getTeamRecommendations } from "../services/api";
import ChatBox from "../components/Chatbox";
import SideBar from "../components/SideBar";
import { TeamContext } from "../contexts/TeamContext";

const welcomeMessage = "How can I help you with your NBA questions?";

function Homepage() {
  // Access team context for budget calculations
  const { addPlayer, budget, setBudget, remainingBudget, spent, team } = useContext(TeamContext);
  
  // Explicitly set player_details as the default mode
  const [modelOption, setModelOption] = useState("gpt-4o-2024-08-06");
  const [responseOption, setResponseOption] = useState("player_details");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: welcomeMessage,
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearChatHistory = async () => {
    try {
      setMessages([]);
      await clearHistory();
      setTimeout(() => {
        setMessages([
          {
            role: "assistant",
            content: welcomeMessage,
          },
        ]);
      }, 500);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleButtonClick = (buttonData, event) => {
    // Debug log
    console.log('Button clicked:', buttonData);
    
    // Prevent default behavior and page refresh
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Handle button clicks based on action type in a timeout to ensure event handling is complete
    setTimeout(() => {
      if (buttonData.action === "add_player" || buttonData.action === "select_player") {
        // Get the salary as a number
        const playerSalary = typeof buttonData.salary === 'string' ? 
          parseFloat(buttonData.salary.replace(/[$,]/g, '')) : 
          parseFloat(buttonData.salary) || 0;
        
        console.log('Adding player with salary:', playerSalary);
        
        // Add the player to the team using context
        const playerAdded = addPlayer({
          name: buttonData.text,
          salary: playerSalary,
          salary_display: buttonData.salary_display
        });
        
        console.log('Player added successfully:', playerAdded);
        console.log('Current team:', team);
        
        // Calculate the new remaining budget (to avoid using stale state)
        const calculatedRemainingBudget = budget - (spent + playerSalary);
        
        // Add a message to the chat indicating the player was added
        if (playerAdded) {
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: "system",
              content: `Added ${buttonData.text} to your team. Remaining budget: $${calculatedRemainingBudget.toLocaleString()}`
            }
          ]);
          
          // Set up a follow-up query but don't submit automatically
          const followUpPrompt = `I've added ${buttonData.text} to my team. My remaining budget is $${calculatedRemainingBudget.toLocaleString()}. Can you recommend more players?`;
          setPrompt(followUpPrompt);
        } else {
          // Player was already on the team
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: "system",
              content: `${buttonData.text} is already on your team. Remaining budget: $${remainingBudget.toLocaleString()}`
            }
          ]);
        }
      }
    }, 0);
    
    // Return false to ensure the event doesn't propagate
    return false;
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      return;
    }

    const userMessage = { role: "user", content: prompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setPrompt("");
    setIsLoading(true);

    try {
      if (responseOption === "manager") {
        // Use the team recommendations endpoint for team builder mode
        const response = await getTeamRecommendations(prompt);
        const assistantMessage = { 
          role: "assistant", 
          content: response.message,
          buttons: response.buttons 
        };
        setMessages([...newMessages, assistantMessage]);
      } else {
        // Use the regular endpoint for other modes
        const assistantReply = await askMainModel(prompt, modelOption, responseOption);
        const assistantMessage = { role: "assistant", content: assistantReply };
        setMessages([...newMessages, assistantMessage]);
      }
    } catch (error) {
      console.error("Error getting response:", error);
      const errorMessage = { role: "assistant", content: "Sorry, there was an error processing your request." };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseOptionChange = (option) => {
    setResponseOption(option);
    const modeNames = {
      'player_details': 'Player Detail',
      'news': 'NBA News',
      'manager': 'Team Builder'
    };
    const modeName = modeNames[option] || option;
    
    // Add the system message to the existing messages array
    const updatedMessages = [...messages, {
      role: "system",
      content: `Mode switched to ${modeName} mode.`
    }];
    
    setMessages(updatedMessages);
  };

  return (
    <div className="flex flex-1 h-[calc(100vh-8rem)] mt-5">
      {/* Sidebar */}
      <div className="w-1/4 min-w-[250px] border-gray-200 overflow-y-auto">
        <SideBar
          modelOption={modelOption}
          setModelOption={setModelOption}
          responseOption={responseOption}
          setResponseOption={handleResponseOptionChange}
          clearChatHistory={clearChatHistory}
        />
      </div>

      {/* Chatbox */}
      <div className="flex-1 overflow-y-auto">
        <ChatBox
          messages={messages}
          prompt={prompt}
          setPrompt={setPrompt}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          responseOption={responseOption}
          onButtonClick={handleButtonClick}
        />
      </div>
    </div>
  );
}

export default Homepage;
