import React, { useState, useContext, useEffect } from "react";
import { askMainModel, clearHistory, getTeamRecommendations } from "../services/api";
import ChatBox from "../components/Chatbox";
import SideBar from "../components/SideBar";
import PlayerSelection from "../components/PlayerSelection";
import { TeamContext } from "../contexts/TeamContext";

const welcomeMessage = "How can I help you with your NBA questions?";

function Homepage() {
  // Access team context for budget calculations
  const { addPlayer, budget, setBudget, remainingBudget, spent, team } = useContext(TeamContext);
  
  // Load modelOption and responseOption from localStorage or use defaults
  const [modelOption, setModelOption] = useState(() => {
    return localStorage.getItem("modelOption") || "gpt-4o-2024-08-06";
  });
  
  const [responseOption, setResponseOption] = useState(() => {
    return localStorage.getItem("responseOption") || "player_details";
  });
  
  const [messages, setMessages] = useState(() => {
    try {
      const savedMessages = localStorage.getItem("chatMessages");
      return savedMessages ? JSON.parse(savedMessages) : [
        {
          role: "assistant",
          content: welcomeMessage,
        },
      ];
    } catch (error) {
      console.error("Error loading messages from localStorage:", error);
      return [
        {
          role: "assistant",
          content: welcomeMessage,
        },
      ];
    }
  });
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedPlayers, setRecommendedPlayers] = useState(() => {
    try {
      const savedPlayers = localStorage.getItem("recommendedPlayers");
      return savedPlayers ? JSON.parse(savedPlayers) : [];
    } catch (error) {
      console.error("Error loading recommended players from localStorage:", error);
      return [];
    }
  });

  // Save modelOption and responseOption to localStorage when they change
  useEffect(() => {
    localStorage.setItem("modelOption", modelOption);
  }, [modelOption]);
  
  useEffect(() => {
    localStorage.setItem("responseOption", responseOption);
  }, [responseOption]);
  
  // Save messages and recommended players to localStorage when they change
  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);
  
  useEffect(() => {
    localStorage.setItem("recommendedPlayers", JSON.stringify(recommendedPlayers));
  }, [recommendedPlayers]);

  const clearChatHistory = async () => {
    try {
      setMessages([]);
      setRecommendedPlayers([]); // Clear recommended players
      
      // Clear from localStorage
      localStorage.removeItem("chatMessages");
      localStorage.removeItem("recommendedPlayers");
      
      await clearHistory();
      setTimeout(() => {
        const welcomeMsg = [
          {
            role: "assistant",
            content: welcomeMessage,
          },
        ];
        setMessages(welcomeMsg);
        localStorage.setItem("chatMessages", JSON.stringify(welcomeMsg));
      }, 500);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleButtonClick = (buttonData) => {
    // Debug output - very verbose
    console.log('-------------------------------------');
    console.log('BUTTON CLICKED - HOMEPAGE COMPONENT');
    console.log('Button data:', buttonData);
    console.log('Current team:', team);
    console.log('-------------------------------------');
    
    // Only proceed if we have valid button data
    if (!buttonData || !buttonData.text) {
      console.error('Invalid button data:', buttonData);
      return;
    }
    
    // Handle player addition - focus only on adding players
    if (buttonData.action === "add_player" || buttonData.action === "select_player") {
      try {
        // Extract player data
        const playerName = buttonData.text || 'Unknown Player';
        
        // Add a message showing the player was picked
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: "system",
            content: `${playerName} picked`
          }
        ]);
        
        // Get the salary as a number
        const playerSalary = typeof buttonData.salary === 'string' ? 
          parseFloat(buttonData.salary.replace(/[$,]/g, '')) : 
          parseFloat(buttonData.salary) || 0;
        
        console.log(`Adding player: ${playerName} with salary: ${playerSalary}`);
        
        // Create player object
        const playerToAdd = {
          name: playerName,
          salary: playerSalary,
          salary_display: buttonData.salary_display
        };
        
        // Add the player using the context function
        const playerAdded = addPlayer(playerToAdd);
        
        console.log('Player added successfully:', playerAdded, 'New team size:', team.length);
        
        // Calculate the new remaining budget
        const calculatedRemainingBudget = budget - (spent + playerSalary);
        
        // Add appropriate message based on whether player was added
        if (playerAdded) {
          // Successfully added the player
          const successMessage = `Added ${playerName} to your team. Remaining budget: $${calculatedRemainingBudget.toLocaleString()}`;
          console.log(successMessage);
          
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: "system",
              content: successMessage
            }
          ]);
          
          // Set up a suggested follow-up query but don't auto-submit
          const suggestedPrompt = `I've added ${playerName} to my team. My remaining budget is $${calculatedRemainingBudget.toLocaleString()}. Can you recommend more players?`;
          setPrompt(suggestedPrompt);
          // No auto-submit, let the user decide to send it
        } else {
          // Player was already on the team
          const existsMessage = `${playerName} is already on your team. Remaining budget: $${remainingBudget.toLocaleString()}`;
          console.log(existsMessage);
          
          setMessages(prevMessages => [
            ...prevMessages,
            {
              role: "system",
              content: existsMessage
            }
          ]);
        }
      } catch (error) {
        console.error('Error adding player:', error);
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: "system",
            content: `Error adding player: ${error.message || 'Unknown error'}`
          }
        ]);
      }
    }
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
        };
        setMessages([...newMessages, assistantMessage]);
        
        // No buttons are expected now that we're using text-based recommendations
        setRecommendedPlayers([]);
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
    
    // Clear recommended players when switching modes
    if (option !== 'manager') {
      setRecommendedPlayers([]);
    }
    
    // Add the system message to the existing messages array
    const updatedMessages = [...messages, {
      role: "system",
      content: `Mode switched to ${modeName} mode.`
    }];
    
    setMessages(updatedMessages);
  };

  const handlePlayerSelect = (player) => {
    // Create button data format matching what handleButtonClick expects
    const buttonData = {
      action: "add_player",
      text: player.name,
      salary: player.salary,
      salary_display: player.salary
    };
    
    // Call the existing handler - NOTE: this already contains auto-message sending via handleButtonClick
    // which sets a follow-up prompt and calls handleSubmit() if the player is successfully added
    handleButtonClick(buttonData);
    
    // We don't need additional auto-messaging here because handleButtonClick already does it
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] mt-5">
      {/* Player Selection Section - Only show when in manager mode */}
      {responseOption === "manager" && (
        <div className="w-full px-4 mb-4">
          <PlayerSelection onPlayerSelect={handlePlayerSelect} />
        </div>
      )}
      
      <div className="flex flex-1">
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
            recommendedPlayers={recommendedPlayers}
          />
        </div>
      </div>
    </div>
  );
}

export default Homepage;
