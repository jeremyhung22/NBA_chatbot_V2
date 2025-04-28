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
        <h2 className="text-xl font-bold text-primary-800">Available Players</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefreshPlayers}
            className="bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1 rounded text-sm transition duration-150"
          >
            Refresh Players
          </button>
        </div>
      </div>
      
      {/* Manual selection form - returned to form submission approach */}
      <form onSubmit={handleManualSearch} className="mb-4 p-3 bg-neutral-50 rounded border border-neutral-200" data-allow-default="true">
        <div className="text-md font-semibold mb-2 text-primary-800">
          Customize Player Selection
          {isUsingCustomRank && (
            <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
              Using Custom Rank: {appliedRank}
            </span>
          )}
        </div>
        <div className="flex items-end gap-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium mb-1 text-neutral-700">Player Rank:</label>
            <input
              type="number"
              value={manualRank}
              onChange={(e) => setManualRank(e.target.value)}
              placeholder="Enter rank (e.g., 80, 250)"
              className="w-full p-2 border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              data-allow-default="true"
              min="1"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm transition duration-150"
              data-allow-default="true"
            >
              Apply Rank
            </button>
            
            <button
              type="button"
              onClick={clearManualInputs}
              className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 px-3 py-2 rounded text-sm transition duration-150"
              data-allow-default="true"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Available players table */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-primary-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-primary-800">Rank</th>
              <th scope="col" className="px-3 py-2 text-left text-sm font-medium text-primary-800">Player</th>
              <th scope="col" className="px-3 py-2 text-right text-sm font-medium text-primary-800">Salary</th>
              <th scope="col" className="px-3 py-2 text-center text-sm font-medium text-primary-800">Add</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {players.map((player, index) => (
              <tr key={index} className="hover:bg-neutral-50">
                <td className="px-3 py-2 text-sm text-neutral-600">{player.rank || index + 1}</td>
                <td className="px-3 py-2 text-sm font-medium text-neutral-900">{player.name}</td>
                <td className="px-3 py-2 text-sm text-right text-neutral-600">{player.salary}</td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={(e) => handleSelectPlayer(player, e)}
                    className="bg-primary-600 hover:bg-primary-700 text-white p-1 px-3 rounded text-xs transition duration-150"
                    data-allow-default="true"
                  >
                    Add
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {players.length === 0 && (
        <div className="text-center py-6 bg-neutral-50 rounded-lg border border-neutral-200">
          <p className="text-neutral-600">No players available for your current budget or rank.</p>
          <p className="text-neutral-600 text-sm mt-1">Try a different rank or clear any filters.</p>
        </div>
      )}
    </div>
  );
};

export default PlayerSelection; 