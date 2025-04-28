import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="sticky top-0 w-full bg-primary-700 border-b border-primary-800 shadow-md z-50 flex items-center px-6 h-20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="-ml-16">
          <Link to="/" className="text-2xl font-sans font-black text-white tracking-wider uppercase relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:bg-secondary-400" data-allow-default="true">🏀 NBA Q&A Assistant</Link>
        </div>
        <div className="flex items-center pl-7">
          <Link to="/" className="text-white hover:text-primary-200 px-6 font-heading font-medium tracking-wide transition-colors duration-200" data-allow-default="true">Home</Link>
          <Link to="/my-team" className="text-white hover:text-primary-200 px-6 font-heading font-medium tracking-wide transition-colors duration-200" data-allow-default="true">My Team</Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
