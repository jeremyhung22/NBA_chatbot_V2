import React from 'react';
import { TeamContext } from '../contexts/TeamContext';
import { useContext } from 'react';

function MyTeamPage() {
  const { team, removePlayer, budget, spent, remainingBudget, resetTeam } = useContext(TeamContext);

  const handleResetTeam = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Resetting team...");
    resetTeam();
  };

  const handleRemovePlayer = (e, playerName) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Removing player:", playerName);
    removePlayer(playerName);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] container mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold text-primary-800 mb-6">My Team</h1>
      
      <div className="mt-4 flex flex-col md:flex-row gap-6">
        {/* Budget information */}
        <div className="md:w-1/3 mb-4 md:mb-0">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-neutral-200">
            <div className="bg-primary-600 px-4 py-3 font-medium text-white">Budget Information</div>
            <div className="p-4">
              <div className="mb-2">
                <span className="font-medium">Total Budget:</span> 
                <span className="float-right">${budget.toLocaleString()}</span>
              </div>
              <div className="mb-2">
                <span className="font-medium">Spent:</span> 
                <span className="float-right">${spent.toLocaleString()}</span>
              </div>
              <div className="mb-2 font-bold">
                <span>Remaining:</span> 
                <span className={`float-right ${remainingBudget < 0 ? 'text-red-600' : 'text-primary-600'}`}>
                  ${remainingBudget.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={handleResetTeam} 
                  className="bg-secondary-600 hover:bg-secondary-700 text-white px-3 py-1 rounded text-sm w-full transition duration-150"
                  data-allow-default="true"
                >
                  Reset Team
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team roster */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-neutral-200">
            <div className="bg-primary-600 px-4 py-3 font-medium text-white">Team Roster ({team.length} players)</div>
            
            {team.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-primary-50">
                      <th className="px-4 py-2 text-left text-primary-800">Player</th>
                      <th className="px-4 py-2 text-right text-primary-800">Salary</th>
                      <th className="px-4 py-2 text-center text-primary-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((player, index) => (
                      <tr key={index} className="border-t border-neutral-200 hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{player.name}</div>
                          {player.position && <div className="text-sm text-neutral-500">{player.position}</div>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {player.formattedSalary || `$${player.salary.toLocaleString()}`}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            className="bg-secondary-600 hover:bg-secondary-700 text-white px-2 py-1 rounded text-sm transition duration-150"
                            onClick={(e) => handleRemovePlayer(e, player.name)}
                            data-allow-default="true"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {team.length === 0 && (
              <div className="text-center text-neutral-500 py-8">
                <p>No players added yet.</p>
                <p className="mt-2">Add players from the chat suggestions!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyTeamPage;
