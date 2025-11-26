import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Mail } from "lucide-react";
import { API_URL } from "../config";

interface FileMeta {
    fileId: string;
    originalName: string;
    size: number;
    uploadTime: string;
}


async function uploadPdfAndGetText(file: File): Promise<{ fileId: string; text: string }> {
    const formData = new FormData();
    formData.append("file", file);

    // Upload the file to backend
    const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
    });

    if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Upload failed");
    }

    const uploadData = await uploadRes.json();
    const fileId: string = uploadData.fileId;

    // Get parsed text from backend
    const viewRes = await fetch(`${API_URL}/api/file/${fileId}/view`);
    if (!viewRes.ok) {
        const errJson = await viewRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to read file contents");
    }

    const text = await viewRes.text();
    if (!text || !text.trim()) {
        throw new Error("File contains no readable text");
    }

    return { fileId, text };
}

export default function CreateProject() {
    const navigate = useNavigate();
    const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
    const [previewText, setPreviewText] = useState<string>("");
    const [isPidLoading, setIsPidLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setError(null);
        setFileMeta(null);
        setPreviewText("");

        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

        try {
            let text: string;
            let fileId: string;

            if (isPdf) {
                // Use backend for PDFs
                const result = await uploadPdfAndGetText(file);
                text = result.text;
                fileId = result.fileId;
            } else {
                // Client-side for text files
                text = await file.text();
                fileId = crypto.randomUUID();
            }

            setPreviewText(text);

            const newFileMeta: FileMeta = {
                fileId,
                originalName: file.name,
                size: file.size,
                uploadTime: new Date().toISOString()
            };
            setFileMeta(newFileMeta);

            // Save to history
            const history = localStorage.getItem("rfp_history");
            const projects = history ? JSON.parse(history) : [];
            projects.unshift(newFileMeta);
            localStorage.setItem("rfp_history", JSON.stringify(projects));

        } catch (err: any) {
            console.error("Failed to read file", err);
            setError(err?.message || "Failed to read file content");
        }
    };

    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];

            // Check file extension
            const allowedExtensions = ['.pdf', '.txt', '.md', '.html', '.htm'];
            const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

            if (!allowedExtensions.includes(fileExtension)) {
                setError(`Unsupported file type. Please upload: ${allowedExtensions.join(', ')}`);
                return;
            }

            // Use same logic as handleFileChange
            setError(null);
            setFileMeta(null);
            setPreviewText("");

            const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

            try {
                let text: string;
                let fileId: string;

                if (isPdf) {
                    // Use backend for PDFs
                    const result = await uploadPdfAndGetText(file);
                    text = result.text;
                    fileId = result.fileId;
                } else {
                    // Client-side for text files
                    text = await file.text();
                    fileId = crypto.randomUUID();
                }

                setPreviewText(text);

                const newFileMeta: FileMeta = {
                    fileId,
                    originalName: file.name,
                    size: file.size,
                    uploadTime: new Date().toISOString()
                };
                setFileMeta(newFileMeta);

                // Save to history
                const history = localStorage.getItem("rfp_history");
                const projects = history ? JSON.parse(history) : [];
                projects.unshift(newFileMeta);
                localStorage.setItem("rfp_history", JSON.stringify(projects));

            } catch (err: any) {
                console.error("Failed to read file", err);
                setError(err?.message || "Failed to read file content");
            }
        }
    };

    const handleGenerateRFP = async () => {
        if (!previewText || !fileMeta) return;

        setIsPidLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/api/generate-pid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fileId: fileMeta.fileId,
                    rfpText: previewText
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Generation failed");
            }

            const data = await res.json();

            // Save project data with PID to localStorage
            const projectData = {
                ...fileMeta,
                rfpText: previewText,
                pidText: data.pid
            };
            localStorage.setItem(`project_data_${fileMeta.fileId}`, JSON.stringify(projectData));

            // Navigate to project details page
            navigate(`/project/${fileMeta.fileId}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsPidLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", minHeight: "calc(100vh - 200px)", justifyContent: "center" }}>
            {error && (
                <div style={{ color: "#ef4444", marginBottom: "1rem", padding: "1rem", backgroundColor: "#fee", borderRadius: "8px", width: "100%", maxWidth: "600px" }}>
                    {error}
                </div>
            )}

            {/* Upload Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    width: "100%",
                    maxWidth: "600px",
                    height: "300px",
                    border: isDragging ? "2px dashed #6B5FFF" : "2px dashed #c7d2fe",
                    borderRadius: "12px",
                    backgroundColor: isDragging ? "#f0edff" : "#f8faff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginBottom: "2rem"
                }}
            >
                <Upload size={48} color="#6B5FFF" style={{ marginBottom: "1rem" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem", margin: 0 }}>
                    Drag & drop RFP documents here
                </h3>
                <p style={{ color: "#6b7280", marginBottom: "0.5rem" }}>or click to browse</p>
                <p style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                    Supported formats: PDF, TXT, MD, HTML
                </p>
                {fileMeta && (
                    <p style={{ fontSize: "0.875rem", color: "#6B5FFF", marginTop: "1rem" }}>
                        📄 {fileMeta.originalName}
                    </p>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept=".pdf,.txt,.md,.html,.htm"
            />

            <div style={{ color: "#9ca3af", fontWeight: "500", marginBottom: "2rem" }}>OR</div>

            {/* Connect Email Button */}
            <button
                className="btn btn-secondary"
                style={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    fontWeight: "500",
                    marginBottom: "3rem"
                }}
            >
                <Mail size={18} />
                Connect Email
            </button>

            {/* Generate RFP Button - Fixed at bottom right */}
            {previewText && (
                <div style={{ position: "fixed", bottom: "2rem", right: "2rem" }}>
                    <button
                        onClick={handleGenerateRFP}
                        disabled={isPidLoading}
                        style={{
                            backgroundColor: "#6B5FFF",
                            color: "white",
                            border: "none",
                            padding: "1rem 2.5rem",
                            borderRadius: "9999px",
                            fontSize: "1rem",
                            fontWeight: "500",
                            cursor: isPidLoading ? "not-allowed" : "pointer",
                            boxShadow: "0 4px 12px rgba(107, 95, 255, 0.4)",
                            opacity: isPidLoading ? 0.7 : 1
                        }}
                        className="btn btn-primary"
                    >
                        {isPidLoading ? "Generating..." : "Generate RFP"}
                    </button>
                </div>
            )}
        </div>
    );
}
