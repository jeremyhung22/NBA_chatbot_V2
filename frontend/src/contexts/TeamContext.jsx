import { createContext, useState, useEffect } from "react";
// Import directly from the absolute path
const DEFAULT_BUDGET = 20000000; // $20,000,000

export const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [team, setTeam] = useState(() => {
    return JSON.parse(localStorage.getItem("myTeam") || "[]");
  });
  
  // Initialize budget from localStorage or set default from config
  const [budget, setBudget] = useState(() => {
    return parseFloat(localStorage.getItem("teamBudget") || DEFAULT_BUDGET.toString());
  });
  
  // Initialize spent amount
  const [spent, setSpent] = useState(() => {
    const savedTeam = JSON.parse(localStorage.getItem("myTeam") || "[]");
    return savedTeam.reduce((total, player) => total + (parseFloat(player.salary) || 0), 0);
  });

  // Save team to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("myTeam", JSON.stringify(team));
    
    // Update spent amount when team changes
    const totalSpent = team.reduce((total, player) => total + (parseFloat(player.salary) || 0), 0);
    setSpent(totalSpent);
  }, [team]);
  
  // Save budget to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("teamBudget", budget.toString());
  }, [budget]);

  const addPlayer = (player) => {
    // Check if player is already on the team
    if (!team.some((p) => p.name === player.name)) {
      // Format salary to ensure it's a number
      const playerSalary = typeof player.salary === 'string' ? 
        parseFloat(player.salary.replace(/[$,]/g, '')) : 
        parseFloat(player.salary) || 0;
      
      // Create a formatted player object
      const formattedPlayer = {
        name: player.name,
        position: player.position || '',
        salary: playerSalary,
        formattedSalary: typeof playerSalary === 'number' ? 
          `$${playerSalary.toLocaleString()}` : 
          player.salary_display || `$${playerSalary}`
      };
      
      setTeam([...team, formattedPlayer]);
      return true;
    }
    return false;
  };
  
  const removePlayer = (playerName) => {
    setTeam(team.filter((p) => p.name !== playerName));
  };
  
  const resetTeam = () => {
    setTeam([]);
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
