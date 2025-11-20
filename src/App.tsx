import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, History as HistoryIcon, FileText, LogOut } from "lucide-react";
import History from "./pages/History";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import "./index.css";

interface SidebarProps {
  onLogout: () => void;
}

function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <FileText size={20} />
        </div>
        <span className="app-name">AI Project Planner</span>
      </div>

      <nav className="nav-menu">
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link to="/create" className={`nav-item ${location.pathname === '/create' ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Create Project</span>
        </Link>
        <Link to="/history" className={`nav-item ${location.pathname === '/history' ? 'active' : ''}`}>
          <HistoryIcon size={20} />
          <span>History</span>
        </Link>
        <div className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item" onClick={onLogout} style={{ cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}

function AppContent() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/create':
        return 'New Project';
      case '/history':
        return 'Project History';
      default:
        return 'AI Project Planner';
    }
  };

  return (
    <div className="app-container">
      <Sidebar onLogout={handleLogout} />
      <main className="main-content">
        <header className="page-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <div className="user-profile">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#6b5fff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>
              JD
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
