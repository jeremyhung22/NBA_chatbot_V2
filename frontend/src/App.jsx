import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import MyTeamPage from "./pages/MyTeamPage";
import NavBar from "./components/NavBar";
import { TeamProvider } from "./contexts/TeamContext";


function App() {
  return (
    <TeamProvider>
      <Router>
        <div className="min-h-screen">
          <NavBar />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/my-team" element={<MyTeamPage />} />
          </Routes>
        </div>
      </Router>
    </TeamProvider>
  );
}

export default App;
