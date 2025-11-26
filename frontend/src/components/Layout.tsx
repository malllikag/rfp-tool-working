import { Outlet, useLocation, Link } from "react-router-dom";
import { History, FileText } from "lucide-react";

export default function Layout() {
    const location = useLocation();

    const getPageTitle = () => {
        switch (location.pathname) {
            case "/":
                return "AI Project Planner";
            case "/create":
                return "New Project";
            default:
                return "AI Project Planner";
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-icon">
                        <FileText size={20} />
                    </div>
                    <span className="app-name">AI Project Planner</span>
                </div>

                <nav className="nav-menu">
                    <Link to="/history" className={`nav-item ${location.pathname === "/history" ? "active" : ""}`}>
                        <History size={20} />
                        <span>History</span>
                    </Link>
                    <Link to="/create" className={`nav-item ${location.pathname === "/create" ? "active" : ""}`}>
                        <FileText size={20} />
                        <span>Create New RFP Project</span>
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
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

                <Outlet />
            </main>
        </div>
    );
}
