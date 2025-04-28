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
      className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1 rounded text-sm inline-block cursor-pointer m-1 transition duration-150"
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
      <div className="bg-white rounded-lg border border-neutral-200 shadow-md p-5 flex flex-col h-full max-h-[90vh]">
        <h2 className="text-xl font-bold text-primary-800">🏀 NBA Player Q&A Assistant</h2>
        <p className="text-neutral-600 text-sm mb-4">Ask any question about NBA players</p>
        
        {/* Show recommended players in Team Builder mode */}
        {responseOption === "manager" && recommendedPlayers.length > 0 && (
          <div className="mb-4 p-3 bg-primary-50 rounded-lg border border-primary-100">
            <h3 className="text-lg font-semibold mb-2 text-primary-800">Recommended Players:</h3>
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
        
        <div className="flex-1 overflow-y-auto mb-4 min-h-[200px] max-h-[calc(90vh-200px)]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-3 p-3 rounded-lg ${
                msg.role === "user" 
                  ? "bg-primary-100 text-primary-800" 
                  : msg.role === "system"
                  ? "bg-neutral-100 text-neutral-800 italic"
                  : "bg-secondary-50 text-secondary-800"
              } animate-fade-in`}
            >
              <strong className={
                msg.role === "user" 
                  ? "text-primary-900" 
                  : msg.role === "system"
                  ? "text-neutral-900"
                  : "text-secondary-900"
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
                      p: ({node, ...props}) => <p className="whitespace-pre-line text-secondary-800" {...props} />,
                      h2: ({node, ...props}) => responseOption === "news" 
                        ? <h2 className="text-xl font-bold mt-3 mb-1 text-secondary-900" {...props} /> 
                        : <h2 {...props} />,
                      a: ({node, ...props}) => responseOption === "news" 
                        ? <a className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} /> 
                        : <a {...props} />,
                      strong: ({node, ...props}) => responseOption === "news" 
                        ? <strong className="font-bold text-secondary-900" {...props} /> 
                        : <strong {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </>
              ) : (
                <p className={
                  msg.role === "user" 
                    ? "text-primary-800" 
                    : "text-neutral-800"
                }>{msg.content}</p>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="mb-3 p-3 rounded-lg bg-secondary-50">
              <div className="flex items-center">
                <strong className="text-secondary-900">Assistant:</strong>
                <div className="ml-2 flex space-x-1">
                  <div className="w-2 h-2 bg-secondary-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-2 h-2 bg-secondary-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-2 h-2 bg-secondary-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="mt-auto flex">
          <input
            type="text"
            className="flex-1 rounded-l-lg border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ask about NBA players"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className={`rounded-r-lg px-4 py-2 text-white ${
              prompt.trim() && !isLoading
                ? "bg-primary-600 hover:bg-primary-700"
                : "bg-neutral-400 cursor-not-allowed"
            } transition duration-150`}
            onClick={handleSendClick}
            disabled={!prompt.trim() || isLoading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;