import React, { useContext } from "react";
import { useState } from "react";
import { TeamContext } from "../contexts/TeamContext";

const SideBar = ({ modelOption, setModelOption, clearChatHistory, setResponseOption }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { budget, spent, remainingBudget } = useContext(TeamContext);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    setIsOpen(false);
    setResponseOption(option); // Send option to parent component
  };

  return (
    <div className="flex flex-col gap-5 ml-5">
      <div className="p-5 bg-gray-50 rounded-lg mt-5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1A1F2C]">Budget Overview</h2>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Total Budget</p>
            <p className="text-2xl font-bold text-[#1A1F2C]">${budget.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Spent</p>
            <p className="text-2xl font-bold text-[#1A1F2C]">${spent.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Remaining</p>
            <p className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${remainingBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-gray-50 rounded-lg mt-2">
        <h3 className="text-lg font-semibold mb-4">Settings</h3>

        <select
          className="w-full p-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={modelOption}
          onChange={(e) => setModelOption(e.target.value)}
        >
          <option value="gpt-4o-2024-08-06">gpt-4o-2024-08-06</option>
          <option value="anthropic/claude-3-opus">
            anthropic/claude-3-opus
          </option>
          <option value="google/gemini-pro">google/gemini-pro</option>
        </select>

        <button
          onClick={clearChatHistory}
          className="w-full py-2 px-4 bg-red-50 text-red-600 border border-red-300 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Clear Chat History
        </button>

        <div className="border-t border-gray-200 my-4 pt-4">
          <p className="text-sm text-gray-600">
            NBA Player Q&A Assistant can answer questions about NBA players,
            teams, games, and statistics.
          </p>
        </div>
      </div>
      <div className="w-full mt-3">
        <div className="flex justify-center items-center relative w-full">
          <button
            type="button"
            className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
            id="menu-button"
            aria-expanded={isOpen}
            aria-haspopup="true"
            onClick={toggleDropdown}
          >
            Agent Options
            <svg
              className="-mr-1 size-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              data-slot="icon"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {isOpen && (
            <div
              className="absolute mt-2 w-full origin-top-center rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-hidden top-full"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabIndex="-1"
            >
              <div className="py-1 w-full" role="none">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  id="menu-item-0"
                  onClick={() => handleOptionClick('player_details')}
                >
                  Player Detail
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  id="menu-item-1"
                  onClick={() => handleOptionClick('news')}
                >
                  NBA news
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  tabIndex="-1"
                  id="menu-item-2"
                  onClick={() => handleOptionClick('manager')}
                >
                  Team Builder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
