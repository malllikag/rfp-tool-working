import { useState, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { LayoutDashboard, Settings, History as HistoryIcon, FileText, LogOut } from "lucide-react";
import History from "./pages/History";
import { API_URL } from "./config";
import "./index.css";

interface FileMeta {
  fileId: string;
  originalName: string;
  size: number;
  uploadTime: string;
}

function CreateProjectPage() {
  // --- State from CreateProject ---
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [previewText, setPreviewText] = useState<string>("");
  // Removed unused preview loading/error state

  const [pidText, setPidText] = useState<string>("");
  const [isPidLoading, setIsPidLoading] = useState(false);
  const [pidError, setPidError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setIsUploading(true);
    setUploadError(null);
    setFileMeta(null); // We don't need fileMeta for preview anymore, but maybe for history?
    setPreviewText("");
    setPidText("");

    try {
      const text = await file.text();
      setPreviewText(text);

      // Save to history (localStorage)
      const newFileMeta: FileMeta = {
        fileId: crypto.randomUUID(),
        originalName: file.name,
        size: file.size,
        uploadTime: new Date().toISOString()
      };
      setFileMeta(newFileMeta);

      const history = localStorage.getItem("rfp_history");
      const projects = history ? JSON.parse(history) : [];
      projects.unshift(newFileMeta);
      localStorage.setItem("rfp_history", JSON.stringify(projects));

    } catch (err) {
      console.error("Failed to read file", err);
      setUploadError("Failed to read file content");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleGeneratePid = async () => {
    if (!previewText) return;

    setIsPidLoading(true);
    setPidError(null);
    setPidText("");

    try {
      const res = await fetch(`${API_URL}/api/generate-pid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfpText: previewText }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setPidText(data.pid);
    } catch (err: any) {
      setPidError(err.message);
    } finally {
      setIsPidLoading(false);
    }
  };



  const copyToClipboard = () => {
    if (pidText) {
      navigator.clipboard.writeText(pidText);
      alert("PID copied to clipboard!");
    }
  };

  // --- Export Functions ---
  const exportToPdf = () => {
    if (!pidText) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(pidText, 180);
    let y = 10;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
      doc.text(splitText[i], 10, y);
      y += 7;
    }
    doc.save("generated-pid.pdf");
  };

  const exportToWord = async () => {
    if (!pidText) return;
    const lines = pidText.split("\n");
    const children = lines.map(line => new Paragraph({
      children: [new TextRun(line)],
      spacing: { after: 200 }
    }));
    const doc = new Document({
      sections: [{ properties: {}, children: children }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "generated-pid.docx");
  };

  const exportToTxt = () => {
    if (!pidText) return;
    const blob = new Blob([pidText], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "generated-pid.txt");
  };

  return (
    <div className="main-grid">
      {/* Left Panel: Input & Preview */}
      <div className="card panel">
        <div className="panel-header">
          <span className="panel-title">RFP Document</span>
          <div className="actions">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
              accept=".pdf,.txt,.md,.html"
            />
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </div>

        <div className="panel-content">
          {uploadError && (
            <div className="status-badge status-error" style={{ marginBottom: '1rem' }}>
              Upload Error: {uploadError}
            </div>
          )}

          {fileMeta ? (
            <>
              <div className="file-info" style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                <span>📄 {fileMeta.originalName}</span>
                <span style={{ marginLeft: '0.5rem' }}>({(fileMeta.size / 1024).toFixed(1)} KB)</span>
              </div>

              {previewText ? (
                <div style={{ whiteSpace: 'pre-wrap' }}>{previewText}</div>
              ) : null}
            </>
          ) : (
            <div className="empty-state">
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                <h3>Upload RFP Document</h3>
                <p>Supported formats: PDF, TXT, MD</p>
              </div>
            </div>
          )}
        </div>

        {previewText && (
          <div style={{ marginTop: '1rem' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleGeneratePid}
              disabled={isPidLoading}
            >
              {isPidLoading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px', marginRight: '8px', borderTopColor: 'white' }}></div>
                  Generating PID...
                </>
              ) : "Generate PID 🚀"}
            </button>
          </div>
        )}
      </div>

      {/* Right Panel: PID Output */}
      <div className="card panel">
        <div className="panel-header">
          <span className="panel-title">Generated PID</span>
          <div className="actions" style={{ display: 'flex', gap: '0.5rem' }}>
            {pidText && (
              <>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportToPdf} title="Export PDF">PDF</button>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportToWord} title="Export Word">DOCX</button>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportToTxt} title="Export Text">TXT</button>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={copyToClipboard} title="Copy">📋</button>
              </>
            )}
          </div>
        </div>

        <div className="panel-content">
          {pidError && (
            <div className="status-badge status-error" style={{ marginBottom: '1rem' }}>
              Generation Error: {pidError}
            </div>
          )}

          {isPidLoading ? (
            <div className="empty-state">
              <div className="loading-spinner"></div>
              <p>Analyzing RFP and drafting PID...</p>
            </div>
          ) : pidText ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{pidText}</div>
          ) : (
            <div className="empty-state">
              <p>PID will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
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
          <FileText size={20} />
          <span>Create Project</span>
        </Link>
        <div className="nav-item">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
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
        <div className="nav-item">
          <LogOut size={20} />
          <span>Logout</span>
        </div>
      </div>
    </aside>
  );
}

function AppContent() {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'New Project';
      case '/history':
        return 'Project History';
      default:
        return 'AI Project Planner';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
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
          <Route path="/" element={<CreateProjectPage />} />
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
