import { createContext, useState, useEffect } from "react";
// Import the budget constants from the config file
import { DEFAULT_BUDGET } from "../../../config/budget_config.js";

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  // Add safeguards for localStorage access
  const getLocalStorageItem = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const setLocalStorageItem = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing ${key} to localStorage:`, error);
    }
  };

  const [team, setTeam] = useState(() => {
    return getLocalStorageItem("myTeam", []);
  });
  
  // Initialize budget from localStorage or set default from config
  const [budget, setBudget] = useState(() => {
    const savedBudget = getLocalStorageItem("teamBudget", DEFAULT_BUDGET);
    return typeof savedBudget === 'number' ? savedBudget : DEFAULT_BUDGET;
  });
  
  // Reset budget to the new default value on initial load
  useEffect(() => {
    // Reset to the current DEFAULT_BUDGET from config
    setBudget(DEFAULT_BUDGET);
    setLocalStorageItem("teamBudget", DEFAULT_BUDGET);
  }, []);
  
  // Initialize spent amount
  const [spent, setSpent] = useState(() => {
    const savedTeam = getLocalStorageItem("myTeam", []);
    return savedTeam.reduce((total, player) => {
      const salary = typeof player.salary === 'string' 
        ? parseFloat(player.salary.replace(/[$,]/g, '')) 
        : parseFloat(player.salary) || 0;
      return total + salary;
    }, 0);
  });

  // Save team to localStorage whenever it changes
  useEffect(() => {
    setLocalStorageItem("myTeam", team);
    
    // Update spent amount when team changes
    const totalSpent = team.reduce((total, player) => {
      const salary = typeof player.salary === 'string' 
        ? parseFloat(player.salary.replace(/[$,]/g, '')) 
        : parseFloat(player.salary) || 0;
      return total + salary;
    }, 0);
    setSpent(totalSpent);
  }, [team]);
  
  // Save budget to localStorage whenever it changes
  useEffect(() => {
    setLocalStorageItem("teamBudget", budget);
  }, [budget]);

  const addPlayer = (player) => {
    console.log("Adding player to team:", player);
    
    try {
      // Format salary to ensure it's a number
      const playerSalary = typeof player.salary === 'string' ? 
        parseFloat(player.salary.replace(/[$,]/g, '')) : 
        parseFloat(player.salary) || 0;
      
      // Check if player is already on the team
      const existingPlayerIndex = team.findIndex(p => p.name === player.name);
      if (existingPlayerIndex >= 0) {
        console.log("Player already on team:", player.name);
        return false;
      }
      
      // Create a formatted player object
      const formattedPlayer = {
        name: player.name,
        position: player.position || '',
        salary: playerSalary,
        formattedSalary: typeof playerSalary === 'number' ? 
          `$${playerSalary.toLocaleString()}` : 
          player.salary_display || `$${playerSalary}`
      };
      
      console.log("Formatted player:", formattedPlayer);
      
      // Get current team and add the new player
      const currentTeam = [...team];
      currentTeam.push(formattedPlayer);
      
      // Update state
      setTeam(currentTeam);
      
      // Directly update localStorage
      try {
        localStorage.setItem("myTeam", JSON.stringify(currentTeam));
        console.log("Team saved to localStorage:", currentTeam);
      } catch (e) {
        console.error("Error saving team to localStorage:", e);
      }
      
      return true;
    } catch (error) {
      console.error("Error adding player:", error);
      return false;
    }
  };
  
  const removePlayer = (playerName) => {
    // Create a new array without the removed player
    const updatedTeam = team.filter((p) => p.name !== playerName);
    
    // Update state
    setTeam(updatedTeam);
    
    // Directly update localStorage to ensure immediate sync
    try {
      localStorage.setItem("myTeam", JSON.stringify(updatedTeam));
      console.log(`Player ${playerName} removed and localStorage updated`);
    } catch (e) {
      console.error("Error updating localStorage after player removal:", e);
    }
  };
  
  const resetTeam = () => {
    setTeam([]);
    // Directly update localStorage to ensure immediate sync
    try {
      localStorage.setItem("myTeam", JSON.stringify([]));
      console.log("Team reset in localStorage");
    } catch (e) {
      console.error("Error resetting team in localStorage:", e);
    }
  };
  
  const resetBudget = (newBudget = DEFAULT_BUDGET) => {
    setBudget(newBudget);
  };

  // Calculate remaining budget
  const remainingBudget = budget - spent;

  return (
    <TeamContext.Provider value={{ 
      team, 
      addPlayer, 
      removePlayer, 
      resetTeam,
      budget,
      setBudget,
      resetBudget,
      spent,
      remainingBudget
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export default TeamContext;
