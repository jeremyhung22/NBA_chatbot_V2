import React, { useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Homepage from "./pages/Homepage";
import MyTeamPage from "./pages/MyTeamPage";
import NavBar from "./components/NavBar";
import { TeamProvider } from "./contexts/TeamContext";

// Add a global script to prevent form submissions
const preventFormSubmission = () => {
  const originalSubmit = HTMLFormElement.prototype.submit;
  HTMLFormElement.prototype.submit = function() {
    console.warn("Form submission prevented");
    return false;
  };
  
  return () => {
    HTMLFormElement.prototype.submit = originalSubmit;
  };
};

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add a watcher for URL changes to /button
  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.pathname === '/button') {
        console.log('Redirecting from /button to homepage');
        navigate('/', { replace: true });
      }
    };
    
    // Watch for location changes
    window.addEventListener('popstate', handleUrlChange);
    
    // Check initial load
    handleUrlChange();
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [navigate]);

  // Prevent form submissions globally
  useEffect(() => {
    // Prevent form submissions
    const cleanup = preventFormSubmission();
    
    // Add a global click handler to prevent navigation on button clicks
    const handleClick = (e) => {
      // Skip if the element has data-allow-default attribute
      if (e.target.hasAttribute('data-allow-default') || 
          e.target.closest('[data-allow-default="true"]') ||
          e.target.closest('[data-menu-container="true"]') ||
          e.target.closest('[data-menu-dropdown="true"]')) {
        console.log('Allowing default behavior for:', e.target);
        return; // Allow default behavior
      }

      // Only prevent default for buttons and button-like elements
      if (e.target.tagName === 'BUTTON' || 
          e.target.closest('[data-button-container="true"]') ||
          e.target.getAttribute('role') === 'button') {
        console.log('Preventing default on button click');
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('click', handleClick, true);
    
    return () => {
      cleanup();
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Create memoized components that won't unmount between navigations
  const memoizedComponents = useMemo(() => ({
    homepage: <Homepage key="persistent-homepage" />,
    myTeam: <MyTeamPage key="persistent-my-team" />
  }), []);

  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes location={location}>
        <Route path="/" element={memoizedComponents.homepage} />
        <Route path="/my-team" element={memoizedComponents.myTeam} />
        <Route path="/button" element={memoizedComponents.homepage} />
        <Route path="*" element={memoizedComponents.homepage} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <TeamProvider>
      <Router>
        <AppContent />
      </Router>
    </TeamProvider>
  );
}

export default App;
