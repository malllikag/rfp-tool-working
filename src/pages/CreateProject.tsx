import { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { API_URL } from "../config";

interface FileMeta {
    fileId: string;
    originalName: string;
    size: number;
    uploadTime: string;
}

export default function CreateProject() {
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [previewText, setPreviewText] = useState<string>("");
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [pidText, setPidText] = useState<string>("");
    const [isPidLoading, setIsPidLoading] = useState(false);
    const [pidError, setPidError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setUploadError(null);
        setFileMeta(null);
        setPreviewText("");
        setPidText("");
        setPreviewError(null);
        setPidError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            const data = await res.json();
            setFileMeta({
                fileId: data.fileId,
                originalName: data.originalName,
                size: data.size,
                uploadTime: data.uploadTime,
            });
        } catch (err: any) {
            setUploadError(err.message || "Error uploading file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleViewFile = async (fileId: string) => {
        setIsPreviewLoading(true);
        setPreviewError(null);
        try {
            const res = await fetch(`${API_URL}/api/file/${fileId}/view`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to load preview");
            }
            const text = await res.text();
            setPreviewText(text);
        } catch (err: any) {
            setPreviewError(err.message);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleGeneratePid = async () => {
        if (!fileMeta?.fileId) return;

        setIsPidLoading(true);
        setPidError(null);
        setPidText("");

        try {
            const res = await fetch(`${API_URL}/api/generate-pid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId: fileMeta.fileId }),
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

    useEffect(() => {
        if (fileMeta?.fileId) {
            handleViewFile(fileMeta.fileId);
        }
    }, [fileMeta]);

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

                            {isPreviewLoading ? (
                                <div className="empty-state">
                                    <div className="loading-spinner"></div>
                                    <p>Loading preview...</p>
                                </div>
                            ) : previewError ? (
                                <div className="status-badge status-error">{previewError}</div>
                            ) : previewText ? (
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

                {fileMeta && (
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
