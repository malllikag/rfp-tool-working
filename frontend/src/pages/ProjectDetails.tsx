import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Loader2, MessageSquare, Send, UserPlus, Share2, RefreshCw } from "lucide-react";
import { API_URL } from "../config";

interface ChatMessage {
    role: "user" | "ai";
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
    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(true);

    // Chat state
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: "ai", text: "I've generated the PID based on your RFP. Would you like me to refine any sections or add more detail?" },
    ]);
    const [isRefining, setIsRefining] = useState(false);

    // Load project data
    useEffect(() => {
        if (!id) return;
        const stored = localStorage.getItem(`project_data_${id}`);
        if (stored) {
            try {
                setProject(JSON.parse(stored));
                setLoading(false);
                return;
            } catch (e) {
                console.error("Failed to parse project data", e);
            }
        }
        const history = localStorage.getItem("rfp_history");
        if (history) {
            try {
                const projects = JSON.parse(history);
                const found = projects.find((p: any) => p.fileId === id);
                if (found) setProject(found);
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
        setLoading(false);
    }, [id]);

    const handleRefine = async () => {
        if (!chatInput.trim() || !project?.pidText) return;
        const userMsg = chatInput;
        setChatInput("");
        setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setIsRefining(true);
        try {
            const resp = await fetch(`${API_URL}/api/refine-pid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPid: project.pidText, instruction: userMsg }),
            });
            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Failed to refine PID");
            const updated = { ...project, pidText: data.refinedPid };
            setProject(updated);
            localStorage.setItem(`project_data_${id}`, JSON.stringify(updated));

            // Also update history if it exists
            const history = localStorage.getItem("rfp_history");
            if (history) {
                try {
                    const projects = JSON.parse(history);
                    const idx = projects.findIndex((p: any) => p.fileId === id);
                    if (idx !== -1) {
                        projects[idx] = updated;
                        localStorage.setItem("rfp_history", JSON.stringify(projects));
                    }
                } catch (e) {
                    console.error("Failed to update history", e);
                }
            }

            setChatMessages((prev) => [...prev, { role: "ai", text: `I've updated the PID based on your request: "${userMsg}".` }]);
        } catch (err: any) {
            console.error("Refinement error", err);
            setChatMessages((prev) => [...prev, { role: "ai", text: "Sorry, I encountered an error while trying to refine the PID. Please try again." }]);
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
        const lines = doc.splitTextToSize(project.pidText, 180);
        let y = 10;
        lines.forEach((line: string) => {
            if (y > 280) { doc.addPage(); y = 10; }
            doc.text(line, 10, y);
            y += 7;
        });
        doc.save("generated-pid.pdf");
    };

    const exportToWord = async () => {
        if (!project?.pidText) return;
        const lines = project.pidText.split("\n");
        const children = lines.map((l) => new Paragraph({ children: [new TextRun(l)], spacing: { after: 200 } }));
        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        saveAs(blob, "generated-pid.docx");
    };

    const exportToTxt = () => {
        if (!project?.pidText) return;
        const blob = new Blob([project.pidText], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "generated-pid.txt");
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!project) {
        return <div style={{ padding: "2rem" }}>Project not found.</div>;
    }

    return (
        <div className="main-grid" style={{ display: "flex", flexDirection: "column", minHeight: "100vh", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1f2937" }}>
                    {project.originalName.replace(/\.[^/.]+$/, "")} - Project Plan
                </h1>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button className="btn" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", color: "#374151", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 500 }}>
                        <UserPlus size={16} /> Invite Collaborators
                    </button>
                    <button className="btn" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", color: "#374151", display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "9999px", fontSize: "0.875rem", fontWeight: 500 }}>
                        <Share2 size={16} /> Share
                    </button>
                    <button className="btn" style={{ backgroundColor: "white", border: "1px solid #e5e7eb", color: "#374151", padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", height: "40vh", minHeight: "300px", marginBottom: "2rem" }}>
                {/* Left panel */}
                <div className="card panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                    <div className="panel-header" style={{ borderBottom: "none", paddingBottom: 0, flexShrink: 0 }}>
                        <span className="panel-title">Original RFP</span>
                    </div>
                    <div className="panel-content" style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
                        <div className="file-info" style={{ marginBottom: "1rem", color: "var(--text-muted)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                            <span>📄 {project.originalName}</span>
                        </div>
                        <div style={{ whiteSpace: "pre-wrap", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1rem", backgroundColor: "#f9fafb", flexGrow: 1, height: "100%" }}>
                            {project.rfpText}
                        </div>
                    </div>
                </div>
                {/* Right panel */}
                <div className="card panel" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                    <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1rem", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
                        <span className="panel-title">Generated PID</span>
                        <div className="actions" style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={exportToPdf} title="Export PDF">PDF</button>
                            <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={exportToWord} title="Export Word">DOCX</button>
                            <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={exportToTxt} title="Export Text">TXT</button>
                            <button className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} onClick={copyToClipboard} title="Copy">📋</button>
                        </div>
                    </div>
                    <div className="panel-content" style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                        <div style={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.9rem", color: project.pidText ? "inherit" : "#6b7280" }}>
                            {project.pidText || "Generated PID placeholder (AI generation error)"}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Assistant */}
            <div className="card" style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", flexGrow: 1, minHeight: "400px", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <MessageSquare size={20} color="#6B5FFF" />
                    <span style={{ fontWeight: 600, color: "#1f2937" }}>AI Assistant</span>
                </div>
                <div style={{ padding: "1.5rem", backgroundColor: "#fff", flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flexGrow: 1, overflowY: "auto", marginBottom: "1.5rem" }}>
                        {chatMessages.map((msg, idx) => (
                            <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                {msg.role === "ai" && (
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#6B5FFF", display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginRight: "0.75rem", fontSize: "0.75rem", fontWeight: "bold" }}>AI</div>
                                )}
                                <div style={{ backgroundColor: msg.role === "user" ? "#6B5FFF" : "#f3f4f6", color: msg.role === "user" ? "white" : "#374151", padding: "1rem 1.5rem", borderRadius: "24px", borderTopLeftRadius: msg.role === "ai" ? "4px" : "24px", borderTopRightRadius: msg.role === "user" ? "4px" : "24px", maxWidth: "80%", lineHeight: "1.5" }}>{msg.text}</div>
                            </div>
                        ))}
                        {isRefining && (
                            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#6B5FFF", display: "flex", alignItems: "center", justifyContent: "center", color: "white", marginRight: "0.75rem", fontSize: "0.75rem", fontWeight: "bold" }}>AI</div>
                                <div style={{ backgroundColor: "#f3f4f6", padding: "1rem 1.5rem", borderRadius: "24px", borderTopLeftRadius: "4px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>Refining PID...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <input
                            type="text"
                            placeholder="Ask AI to refine PID..."
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isRefining && handleRefine()}
                            style={{ width: "100%", padding: "1rem 1.5rem", paddingRight: "3.5rem", borderRadius: "9999px", border: "1px solid #e5e7eb", outline: "none", fontSize: "1rem", boxSizing: "border-box" }}
                        />
                        <button
                            onClick={handleRefine}
                            disabled={!chatInput.trim() || isRefining}
                            style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#6B5FFF", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: chatInput.trim() ? 1 : 0.5 }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
