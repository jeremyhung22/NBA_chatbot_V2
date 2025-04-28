import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { TeamContext } from '../contexts/TeamContext';

const PlayerSelection = ({ onPlayerSelect }) => {
  const { team, remainingBudget } = useContext(TeamContext);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [manualRank, setManualRank] = useState('');
  const [isUsingCustomRank, setIsUsingCustomRank] = useState(false);
  const [appliedRank, setAppliedRank] = useState(''); // Track the currently applied rank

  // Fetch players whenever needed
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        console.log("Fetching players with refreshTrigger:", refreshTrigger);
        console.log("Current appliedRank:", appliedRank);
        console.log("isUsingCustomRank:", isUsingCustomRank);
        
        // Determine query parameters based on user inputs
        let queryParams = new URLSearchParams();
        
        // If we have an applied rank from the form submission, use it
        if (appliedRank && !isNaN(parseInt(appliedRank))) {
          console.log(`Using applied custom rank: ${appliedRank}`);
          queryParams.append('rank', appliedRank);
        }
        // Otherwise use remaining budget
        else {
          console.log(`Using budget: ${remainingBudget}`);
          queryParams.append('budget', remainingBudget);
        }
        
        // Make the API call with the appropriate parameters
        const url = `/api/available-players?${queryParams.toString()}`;
        console.log("Fetching from URL:", url);
        const response = await axios.get(url);
        
        console.log("API response:", response.data.length, "players");
        setPlayers(response.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching players:', err);
        setError('Failed to load players. Please try again.');
        setLoading(false);
        
        // Fallback to hardcoded players if API fails
        setPlayers([
          { name: "LeBron James", rank: "1.", salary: "$47,600,000" },
          { name: "Stephen Curry", rank: "2.", salary: "$55,760,000" },
          { name: "Kevin Durant", rank: "3.", salary: "$51,200,000" },
          { name: "Giannis Antetokounmpo", rank: "4.", salary: "$48,800,000" },
          { name: "Nikola Jokic", rank: "5.", salary: "$50,200,000" }
        ]);
      }
    };

    fetchPlayers();
  }, [refreshTrigger, appliedRank]); // Depend on refreshTrigger and appliedRank

  // Monitor team and budget changes to decide if we should refresh
  useEffect(() => {
    // Only auto-refresh if we're not using a custom rank
    if (!isUsingCustomRank) {
      console.log("Auto-refreshing due to team/budget changes");
      setRefreshTrigger(prev => prev + 1);
    }
  }, [team.length, remainingBudget, isUsingCustomRank]);

  const handleSelectPlayer = (player, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (onPlayerSelect) {
      onPlayerSelect(player);
      // Only refresh automatically if we're not using custom rank
      if (!isUsingCustomRank) {
        console.log("Refreshing after player selection");
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.log("Not refreshing after selection (using custom rank)");
      }
    }
  };
  
  // Revert back to the approach that was working earlier
  const handleManualSearch = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("👉 Applying manual rank:", manualRank);
    
    if (manualRank && !isNaN(parseInt(manualRank))) {
      // Save the current state to log
      const prevRank = appliedRank;
      
      try {
        // Update the states
        setIsUsingCustomRank(true);
        setAppliedRank(manualRank); // This will trigger the useEffect to fetch players
        
        console.log(`👉 Changed rank from ${prevRank} to ${manualRank}`);
        
        // Show temporary visual feedback
        const feedbackElement = document.createElement('div');
        feedbackElement.textContent = `Rank ${manualRank} applied!`;
        feedbackElement.style.cssText = 'position: fixed; top: 20px; right: 20px; background: green; color: white; padding: 10px; border-radius: 5px; z-index: 1000;';
        document.body.appendChild(feedbackElement);
        
        // Remove after 2 seconds
        setTimeout(() => {
          document.body.removeChild(feedbackElement);
        }, 2000);
      } catch (error) {
        console.error("Error applying rank:", error);
      }
    } else {
      console.log("❌ Invalid rank input:", manualRank);
      setIsUsingCustomRank(false);
      setAppliedRank('');
    }
  };
  
  const clearManualInputs = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("Clearing manual inputs");
    setManualRank('');
    setAppliedRank('');
    setIsUsingCustomRank(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefreshPlayers = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return <div className="text-center py-4">Loading available players...</div>;
  }

  if (error && players.length === 0) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Available Players</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefreshPlayers}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
          >
            Refresh Players
          </button>
        </div>
      </div>
      
      {/* Manual selection form - returned to form submission approach */}
      <form onSubmit={handleManualSearch} className="mb-4 p-3 bg-gray-100 rounded" data-allow-default="true">
        <div className="text-md font-semibold mb-2">
          Customize Player Selection
          {isUsingCustomRank && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              Using Custom Rank: {appliedRank}
            </span>
          )}
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium mb-1">Player Rank:</label>
            <input
              type="number"
              value={manualRank}
              onChange={(e) => setManualRank(e.target.value)}
              placeholder="Enter rank (e.g., 80, 250)"
              className="w-full p-2 border rounded"
              data-allow-default="true"
              min="1"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={clearManualInputs}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-sm"
            >
              Reset to Budget
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              data-allow-default="true"
            >
              Apply Rank ✓
            </button>
          </div>
        </div>
      </form>
      
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {players.map((player, index) => (
          <button
            key={index}
            onClick={(e) => handleSelectPlayer(player, e)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded shadow transition-colors"
          >
            <div className="flex flex-col items-start">
              <span className="text-lg">{player.name}</span>
              <div className="flex justify-between w-full mt-1">
                <span className="text-sm opacity-80">Rank: {player.rank}</span>
                <span className="text-sm opacity-80">{player.salary}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerSelection; 