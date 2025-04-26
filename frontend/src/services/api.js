import axios from "axios";

// Create an axios instance with default config
const api = axios.create({
  baseURL: "/api", // This will use the proxy defined in vite.config.js
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2 minute timeout - adjust based on expected response time
});

// Add request retry logic
api.interceptors.response.use(undefined, async (err) => {
  const { config, message } = err;
  
  // Don't retry if we've already retried or it wasn't a timeout
  if (!config || config._retryCount >= 2 || 
     !(message.includes('timeout') || message.includes('socket hang up') || message.includes('Network Error'))) {
    return Promise.reject(err);
  }
  
  // Set retry count and delay retry attempt
  config._retryCount = config._retryCount || 0;
  config._retryCount += 1;
  
  console.log(`Retrying API request (attempt ${config._retryCount}/2)...`);
  
  // Wait before retrying (exponential backoff)
  await new Promise(resolve => setTimeout(resolve, 1000 * config._retryCount));
  return api(config);
});

export const askMainModel = async (prompt, model, response_option) => {
  try {
    const response = await api.post("/ask", {
      prompt,
      model,
      response_option,
    });
    return response.data.message;
  } catch (err) {
    console.error("API Error:", err.message || err);
    return "⚠️ Error: Unable to get response from server. Please try again.";
  }
};

export const getTeamRecommendations = async (prompt) => {
  try {
    const response = await api.post("/team/recommendations", {
      prompt,
    });
    return {
      message: response.data.message,
      buttons: response.data.buttons || []
    };
  } catch (err) {
    console.error("Team Recommendations API Error:", err.message || err);
    return {
      message: "⚠️ Error: Unable to get team recommendations. Please try again in a moment.",
      buttons: []
    };
  }
};

export const clearHistory = async () => {
  try {
    const response = await api.post("/clear");
    return response.data.message;
  } catch (err) {
    console.error("Clear History API Error:", err.message || err);
    return "⚠️ Error: Unable to clear chat history. Please try again.";
  }
};
