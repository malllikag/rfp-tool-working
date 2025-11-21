import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Upload, FileText, ArrowRight, Loader2, Download, MessageSquare, Send } from "lucide-react";
import { API_URL } from "../config";

interface FileMeta {
    fileId: string;
    originalName: string;
    size: number;
    uploadTime: string;
}

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

export default function CreateProject() {
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [previewText, setPreviewText] = useState<string>("");

    const [pidText, setPidText] = useState<string>("");
    const [isPidLoading, setIsPidLoading] = useState(false);
    const [pidError, setPidError] = useState<string | null>(null);

    // Chat State
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        { role: 'ai', text: "I've generated the PID based on your RFP. Would you like me to refine any sections or add more detail?" }
    ]);
    const [isRefining, setIsRefining] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setUploadError(null);
        setFileMeta(null);
        setPreviewText("");
        setPidText("");

        try {
            const text = await file.text();
            setPreviewText(text);

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

    const handleRefine = async () => {
        if (!chatInput.trim() || !pidText) return;

        const userMessage = chatInput;
        setChatInput("");
        setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsRefining(true);

        try {
            const response = await fetch(`${API_URL}/api/refine-pid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPid: pidText,
                    instruction: userMessage
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to refine PID");
            }

            setPidText(data.refinedPid);
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
        if (pidText) {
            navigator.clipboard.writeText(pidText);
            alert("PID copied to clipboard!");
        }
    };

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

            {/* AI Assistant Chat Section */}
            {pidText && (
                <div className="card" style={{ marginTop: "2rem" }}>
                    <div className="panel-header" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <MessageSquare size={20} color="var(--primary)" />
                        <span className="panel-title">AI Assistant</span>
                    </div>
                    <div className="panel-content">
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "1rem",
                            maxHeight: "400px",
                            overflowY: "auto",
                            marginBottom: "1.5rem",
                            padding: "1rem",
                            backgroundColor: "#f9fafb",
                            borderRadius: "12px"
                        }}>
                            {chatMessages.map((msg, index) => (
                                <div key={index} style={{
                                    display: "flex",
                                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        maxWidth: "80%",
                                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                    }}>
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            backgroundColor: msg.role === 'user' ? 'var(--primary)' : '#6b5fff',
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            flexShrink: 0,
                                            fontSize: "0.75rem",
                                            fontWeight: "bold"
                                        }}>
                                            {msg.role === 'user' ? 'JD' : 'AI'}
                                        </div>
                                        <div style={{
                                            backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'white',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-main)',
                                            padding: "1rem",
                                            borderRadius: "12px",
                                            boxShadow: msg.role === 'ai' ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                                            border: msg.role === 'ai' ? "1px solid var(--border-color)" : "none"
                                        }}>
                                            {msg.text}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isRefining && (
                                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                    <div style={{ display: "flex", gap: "0.75rem", maxWidth: "80%" }}>
                                        <div style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            backgroundColor: '#6b5fff',
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "white",
                                            flexShrink: 0,
                                            fontWeight: "bold"
                                        }}>
                                            AI
                                        </div>
                                        <div style={{
                                            backgroundColor: 'white',
                                            padding: "1rem",
                                            borderRadius: "12px",
                                            border: "1px solid var(--border-color)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.5rem"
                                        }}>
                                            <div className="loading-spinner" style={{ width: "16px", height: "16px" }}></div>
                                            <span>Refining PID...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Ask AI to refine PID..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isRefining) {
                                        handleRefine();
                                    }
                                }}
                                disabled={isRefining}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleRefine}
                                disabled={!chatInput.trim() || isRefining}
                                style={{ padding: "0.75rem" }}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
