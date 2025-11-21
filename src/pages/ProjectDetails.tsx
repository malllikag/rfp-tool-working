import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Loader2, MessageSquare, Send, UserPlus, Share2, RefreshCw } from "lucide-react";
import { API_URL } from "../config";

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

interface ProjectData {
    fileId: string;
    originalName: string;
    uploadTime: string;
    rfpText: string;
    pidText: string;
}

export default function ProjectDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    // Chat State
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'ai', text: "I've generated the PID based on your RFP. Would you like me to refine any sections or add more detail?" }
    ]);
    const [isRefining, setIsRefining] = useState(false);

    useEffect(() => {
        if (!id) return;

        // Try to load from specific project storage first
        const storedData = localStorage.getItem(`project_data_${id}`);
        if (storedData) {
            try {
                setProject(JSON.parse(storedData));
                setLoading(false);
                return;
            } catch (e) {
                console.error("Failed to parse project data", e);
            }
        }

        // Fallback: Check history (though history might not have full text in future optimizations)
        const history = localStorage.getItem("rfp_history");
        if (history) {
            try {
                const projects = JSON.parse(history);
                const found = projects.find((p: any) => p.fileId === id);
                if (found) {
                    // If we found it in history but not in detailed storage, we might be missing text if we didn't save it there.
                    // For now, assume we save everything in project_data_${id} during creation.
                    setProject(found);
                }
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
        setLoading(false);
    }, [id]);

    const handleRefine = async () => {
        if (!chatInput.trim() || !project?.pidText) return;

        const userMessage = chatInput;
        setChatInput("");
        setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsRefining(true);

        try {
            const response = await fetch(`${API_URL}/api/refine-pid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPid: project.pidText,
                    instruction: userMessage
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to refine PID");
            }

            // Update local state and storage
            const updatedProject = { ...project, pidText: data.refinedPid };
            setProject(updatedProject);
            localStorage.setItem(`project_data_${id}`, JSON.stringify(updatedProject));

            setChatMessages(prev => [...prev, {
                role: 'ai',
                text: `I've updated the PID based on your request: "${userMessage}".`
            }]);
        } catch (err: any) {
            console.error("Refinement error:", err);
            setChatMessages(prev => [...prev, {
                role: 'ai',
                text: "Sorry, I encountered an error while trying to refine the PID. Please try again."
            }]);
        } finally {
            setIsRefining(false);
        }
    };

    const copyToClipboard = () => {
        if (project?.pidText) {
            navigator.clipboard.writeText(project.pidText);
            alert("PID copied to clipboard!");
        }
    };

    const exportToPdf = () => {
        if (!project?.pidText) return;
        const doc = new jsPDF();
        const splitText = doc.splitTextToSize(project.pidText, 180);
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
        if (!project?.pidText) return;
        const lines = project.pidText.split("\n");
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
        if (!project?.pidText) return;
        const blob = new Blob([project.pidText], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "generated-pid.txt");
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Loader2 className="animate-spin" /></div>;
    }

    if (!project) {
        return <div style={{ padding: '2rem' }}>Project not found.</div>;
    }

    return (
        <div className="main-grid" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header with Actions */}
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937" }}>{project.originalName.replace(/\.[^/.]+$/, "")} - Project Plan</h1>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button className="btn" style={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                    }}>
                        <UserPlus size={16} />
                        Invite Collaborators
                    </button>
                    <button className="btn" style={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1rem",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500"
                    }}>
                        <Share2 size={16} />
                        Share
                    </button>
                    <button className="btn" style={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        color: "#374151",
                        padding: "0.5rem",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>

                {/* Left Panel: Original RFP */}
                <div className="card panel" style={{ display: "flex", flexDirection: "column" }}>
                    <div className="panel-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                        <span className="panel-title">Original RFP</span>
                    </div>

                    <div className="panel-content" style={{ display: "flex", flexDirection: "column" }}>
                        <div className="file-info" style={{ marginBottom: '1rem', color: 'var(--text-muted)', display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span>📄 {project.originalName}</span>
                            </div>
                        </div>
                        <div style={{
                            whiteSpace: 'pre-wrap',
                            height: "400px",
                            overflowY: "auto",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            padding: "1rem",
                            backgroundColor: "#f9fafb"
                        }}>{project.rfpText}</div>
                    </div>
                </div>

                {/* Right Panel: Generated PID */}
                <div className="card panel" style={{ minHeight: "600px", display: "flex", flexDirection: "column" }}>
                    <div className="panel-header">
                        <span className="panel-title">Generated PID</span>
                        <div className="actions" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportToPdf} title="Export PDF">PDF</button>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportToWord} title="Export Word">DOCX</button>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={exportToTxt} title="Export Text">TXT</button>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={copyToClipboard} title="Copy">📋</button>
                        </div>
                    </div>

                    <div className="panel-content" style={{ flex: 1, overflowY: "auto" }}>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{project.pidText}</div>
                    </div>
                </div>
            </div>

            {/* AI Assistant */}
            <div className="card" style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
                <div style={{
                    padding: "1rem 1.5rem",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                }}>
                    <MessageSquare size={20} color="#6366f1" />
                    <span style={{ fontWeight: "600", color: "#1f2937" }}>AI Assistant</span>
                </div>

                <div style={{ padding: "1.5rem", backgroundColor: "#fff" }}>
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                        maxHeight: "400px",
                        overflowY: "auto",
                        marginBottom: "1.5rem"
                    }}>
                        {chatMessages.map((msg, index) => (
                            <div key={index} style={{
                                display: "flex",
                                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                {msg.role === 'ai' && (
                                    <div style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "50%",
                                        backgroundColor: "#6366f1",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "white",
                                        marginRight: "0.75rem",
                                        fontSize: "0.75rem",
                                        fontWeight: "bold"
                                    }}>AI</div>
                                )}
                                <div style={{
                                    backgroundColor: msg.role === 'user' ? '#6366f1' : '#f3f4f6',
                                    color: msg.role === 'user' ? 'white' : '#374151',
                                    padding: "1rem 1.5rem",
                                    borderRadius: "24px",
                                    borderTopLeftRadius: msg.role === 'ai' ? "4px" : "24px",
                                    borderTopRightRadius: msg.role === 'user' ? "4px" : "24px",
                                    maxWidth: "80%",
                                    lineHeight: "1.5"
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isRefining && (
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "#6366f1",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    marginRight: "0.75rem",
                                    fontSize: "0.75rem",
                                    fontWeight: "bold"
                                }}>AI</div>
                                <div style={{
                                    backgroundColor: '#f3f4f6',
                                    padding: "1rem 1.5rem",
                                    borderRadius: "24px",
                                    borderTopLeftRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem"
                                }}>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Refining PID...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ position: "relative" }}>
                        <input
                            type="text"
                            placeholder="Ask AI to refine PID..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isRefining && handleRefine()}
                            style={{
                                width: "100%",
                                padding: "1rem 1.5rem",
                                paddingRight: "3.5rem",
                                borderRadius: "9999px",
                                border: "1px solid #e5e7eb",
                                outline: "none",
                                fontSize: "1rem"
                            }}
                        />
                        <button
                            onClick={handleRefine}
                            disabled={!chatInput.trim() || isRefining}
                            style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                backgroundColor: "#6366f1",
                                border: "none",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                opacity: chatInput.trim() ? 1 : 0.5
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
