import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="sticky top-0 w-full bg-gray border-b shadow-md z-50 flex items-center px-6 h-20">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">🏀 NBA Q&A Assistant</Link>
        <div className="flex items-center">
          <Link to="/" className="hover:text-gray-500 px-4" >Home</Link>
          <Link to="/my-team" className="hover:text-gray-500 px-4" >My Team</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
