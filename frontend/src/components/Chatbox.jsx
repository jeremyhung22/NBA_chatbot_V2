import React, { useEffect, useRef } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';

// Add a custom PlayerButton component
const PlayerButton = ({ button, onClick }) => {
  // Handle click completely differently
  const handleClick = (e) => {
    // Prevent any browser default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Call the callback directly
    if (onClick && button) {
      console.log('PlayerButton: Calling onClick with button data', button);
      onClick(button);
    }
    return false;
  };

  // Use a button element with type="button" to prevent form submission
  return (
    <button
      type="button"
      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm inline-block cursor-pointer m-1"
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
    >
      {button.text}
    </button>
  );
};

const ChatBox = ({ messages, prompt, setPrompt, handleSubmit, isLoading, responseOption, onButtonClick, recommendedPlayers }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add a global click handler to prevent navigation
  useEffect(() => {
    const preventButtonNavigation = (e) => {
      // If it's a button or inside a button container
      if (e.target.closest('[data-button-container="true"]')) {
        e.preventDefault();
        console.log('Chatbox: Preventing default button behavior');
      }
    };

    // Capture phase to get it before any other handlers
    document.addEventListener('click', preventButtonNavigation, true);
    
    return () => {
      document.removeEventListener('click', preventButtonNavigation, true);
    };
  }, []);

  // Handle submit without form submission
  const handleSendClick = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (prompt.trim() && !isLoading) {
      handleSubmit();
    }
    
    return false;
  };

  // Handle Enter key without form submission
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isLoading) {
        handleSubmit();
      }
    }
  };

  // Handle button click with proper event prevention
  const handleButtonClick = (buttonData, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('Button clicked from container');
    onButtonClick(buttonData);
    return false;
  };

  return (
    <div className="h-full w-full p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col h-full">
        <h2 className="text-xl font-bold">🏀 NBA Player Q&A Assistant</h2>
        <p className="text-gray-600 text-sm mb-4">Ask any question about NBA players</p>
        
        {/* Show recommended players in Team Builder mode */}
        {responseOption === "manager" && recommendedPlayers.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Recommended Players:</h3>
            <div 
              className="flex flex-wrap gap-2"
              onClick={(e) => e.preventDefault()}
              onMouseDown={(e) => e.preventDefault()}
            >
              {recommendedPlayers.map((player, index) => (
                <PlayerButton
                  key={index}
                  button={player}
                  onClick={(buttonData) => handleButtonClick(buttonData)}
                />
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto mb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 p-3 rounded-lg ${
                msg.role === "user" 
                  ? "bg-blue-100 text-blue-800" 
                  : msg.role === "system"
                  ? "bg-gray-100 text-gray-800 italic"
                  : "bg-red-100 text-red-800"
              } animate-fade-in`}
            >
              <strong className={
                msg.role === "user" 
                  ? "text-blue-900" 
                  : msg.role === "system"
                  ? "text-gray-900"
                  : "text-red-900"
              }>
                {msg.role === "user" 
                  ? "You" 
                  : msg.role === "system" 
                  ? "System" 
                  : "Assistant"}:
              </strong>
              {msg.role === "assistant" ? (
                <>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="whitespace-pre-line text-red-800" {...props} />,
                      h2: ({node, ...props}) => responseOption === "news" 
                        ? <h2 className="text-xl font-bold mt-3 mb-1 text-red-900" {...props} /> 
                        : <h2 {...props} />,
                      a: ({node, ...props}) => responseOption === "news" 
                        ? <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} /> 
                        : <a {...props} />,
                      strong: ({node, ...props}) => responseOption === "news" 
                        ? <strong className="font-bold text-red-900" {...props} /> 
                        : <strong {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </>
              ) : (
                <p className={
                  msg.role === "user" 
                    ? "text-blue-800" 
                    : "text-gray-800"
                }>{msg.content}</p>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="mb-3 p-3 rounded-lg bg-red-100">
              <div className="flex items-center">
                <strong className="text-red-900">Assistant:</strong>
                <div className="ml-2 flex space-x-1">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-auto flex">
          <input
            type="text"
            className="flex-1 rounded-l-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about NBA players"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            data-allow-default="true"
          />
          <button
            onClick={handleSendClick}
            disabled={!prompt.trim() || isLoading}
            className={`bg-blue-500 text-white px-4 py-2 rounded-r-lg 
              ${(!prompt.trim() || isLoading) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
            type="button"
            data-allow-default="true"
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;