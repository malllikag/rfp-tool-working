import { useEffect, useState } from "react";
import { FileText, Download, Trash2, X } from "lucide-react";

interface ProjectFile {
    fileId: string;
    originalName: string;
    size: number;
    uploadTime: string;
}

interface DeleteConfirmation {
    fileId: string;
    fileName: string;
}

export default function History() {
    const [projects, setProjects] = useState<ProjectFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<DeleteConfirmation | null>(null);

    useEffect(() => {
        const loadHistory = () => {
            try {
                const history = localStorage.getItem("rfp_history");
                if (history) {
                    setProjects(JSON.parse(history));
                }
            } catch (e) {
                console.error("Failed to load history", e);
                setError("Failed to load history");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    const handleDeleteCancel = () => {
        setConfirmDelete(null);
    };

    const handleDownload = (fileId: string) => {
        console.log("Download requested for:", fileId);
        alert("File content is not stored in history, only metadata.");
    };

    const handleDeleteClick = (fileId: string, fileName: string) => {
        setConfirmDelete({ fileId, fileName });
    };

    const handleDeleteConfirm = () => {
        if (!confirmDelete) return;

        try {
            const updatedProjects = projects.filter(p => p.fileId !== confirmDelete.fileId);
            setProjects(updatedProjects);
            localStorage.setItem("rfp_history", JSON.stringify(updatedProjects));
            setConfirmDelete(null);
        } catch (e) {
            console.error("Failed to delete project", e);
            alert("Failed to delete project");
        }
    };

    return (
        <>
            <div className="panel card">
                <div className="panel-header">
                    <span className="panel-title">Project History</span>
                </div>
                <div className="panel-content">
                    {loading ? (
                        <div className="empty-state">
                            <div className="loading-spinner"></div>
                            <p>Loading history...</p>
                        </div>
                    ) : error ? (
                        <div className="status-badge status-error">{error}</div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state">
                            <p>No projects found.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {projects.map((project) => (
                                <div
                                    key={project.fileId}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "1rem",
                                        border: "1px solid var(--border-color)",
                                        borderRadius: "var(--radius-md)",
                                        backgroundColor: "white",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                        <div
                                            style={{
                                                width: "40px",
                                                height: "40px",
                                                borderRadius: "8px",
                                                backgroundColor: "rgba(107, 95, 255, 0.1)",
                                                color: "var(--primary)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: "600", color: "var(--text-main)" }}>
                                                {project.originalName}
                                            </div>
                                            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                                {(project.size / 1024).toFixed(1)} KB •{" "}
                                                {new Date(project.uploadTime).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => handleDownload(project.fileId)}
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => handleDeleteClick(project.fileId, project.originalName)}
                                            title="Delete"
                                            style={{
                                                color: "#ef4444",
                                                borderColor: "#ef4444",
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {confirmDelete && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={handleDeleteCancel}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: "400px",
                            width: "90%",
                            padding: "1.5rem",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>Confirm Delete</h3>
                            <button
                                onClick={handleDeleteCancel}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "0.25rem",
                                    color: "var(--text-muted)",
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)" }}>
                            Are you sure you want to delete <strong>"{confirmDelete.fileName}"</strong>? This action cannot be undone.
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn btn-secondary" onClick={handleDeleteCancel}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleDeleteConfirm}
                                style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
