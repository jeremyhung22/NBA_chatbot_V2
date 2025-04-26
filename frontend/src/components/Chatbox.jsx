import React, { useEffect, useRef } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';

// Add a custom PlayerButton component
const PlayerButton = ({ button, onClick }) => {
  const handleClick = (e) => {
    // Stop propagation and prevent default
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    // Add a small delay to ensure the event is fully handled
    setTimeout(() => {
      onClick(button, e); // Pass both button data and event
    }, 10);
    
    // Return false to prevent default browser behavior
    return false;
  };

  return (
    <span
      onClick={handleClick}
      onMouseDown={(e) => e.preventDefault()}
      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors inline-block cursor-pointer"
    >
      {button.text}
    </span>
  );
};

const ChatBox = ({ messages, prompt, setPrompt, handleSubmit, isLoading, responseOption, onButtonClick }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="h-full w-full p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col h-full">
        <h2 className="text-xl font-bold">🏀 NBA Player Q&A Assistant</h2>
        <p className="text-gray-600 text-sm mb-4">Ask any question about NBA players</p>
        
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
                  
                  {/* Render buttons if available */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.buttons.map((button, btnIndex) => (
                        <PlayerButton
                          key={btnIndex}
                          button={button}
                          onClick={onButtonClick}
                        />
                      ))}
                    </div>
                  )}
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (prompt.trim() && !isLoading) {
                  handleSubmit();
                }
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className={`bg-blue-500 text-white px-4 py-2 rounded-r-lg 
              ${(!prompt.trim() || isLoading) ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;