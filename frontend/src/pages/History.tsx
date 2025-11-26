import { useEffect, useState } from "react";
import { Eye, Trash2, X } from "lucide-react";

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
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, []);

    const handleDeleteCancel = () => {
        setConfirmDelete(null);
    };

    const handleView = (fileId: string) => {
        // For now, just alert as we don't have the full content stored
        alert(`Viewing details for file ID: ${fileId}\n(Content storage not yet implemented)`);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div style={{ padding: "1rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "2rem", color: "#333" }}>History</h2>

            {loading ? (
                <div className="empty-state">
                    <div className="loading-spinner"></div>
                    <p>Loading history...</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="empty-state">
                    <p>No projects found.</p>
                </div>
            ) : (
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    overflow: "hidden"
                }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                                <th style={{ padding: "1.5rem", fontWeight: "600", color: "#666", fontSize: "0.875rem" }}>Proposal Name</th>
                                <th style={{ padding: "1.5rem", fontWeight: "600", color: "#666", fontSize: "0.875rem" }}>Date Created</th>
                                <th style={{ padding: "1.5rem", fontWeight: "600", color: "#666", fontSize: "0.875rem" }}>Status</th>
                                <th style={{ padding: "1.5rem", fontWeight: "600", color: "#666", fontSize: "0.875rem" }}>Last Updated</th>
                                <th style={{ padding: "1.5rem", fontWeight: "600", color: "#666", fontSize: "0.875rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.fileId} style={{ borderBottom: "1px solid #f9fafb" }}>
                                    <td style={{ padding: "1.5rem", fontWeight: "500", color: "#333" }}>
                                        {project.originalName}
                                    </td>
                                    <td style={{ padding: "1.5rem", color: "#666", fontSize: "0.875rem" }}>
                                        {formatDate(project.uploadTime)}
                                    </td>
                                    <td style={{ padding: "1.5rem" }}>
                                        <span style={{
                                            backgroundColor: "#d1fae5",
                                            color: "#065f46",
                                            padding: "0.25rem 0.75rem",
                                            borderRadius: "9999px",
                                            fontSize: "0.75rem",
                                            fontWeight: "500"
                                        }}>
                                            Completed
                                        </span>
                                    </td>
                                    <td style={{ padding: "1.5rem", color: "#666", fontSize: "0.875rem" }}>
                                        {formatDate(project.uploadTime)}
                                    </td>
                                    <td style={{ padding: "1.5rem" }}>
                                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                            <button
                                                onClick={() => handleView(project.fileId)}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#6b5fff" }}
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(project.fileId, project.originalName)}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
        </div>
    );
}
