import { useState, useEffect } from "react";
import { FileText } from "lucide-react";

interface ProjectFile {
    fileId: string;
    originalName: string;
    size: number;
    uploadTime: string;
}

export default function Dashboard() {
    const [projects, setProjects] = useState<ProjectFile[]>([]);

    useEffect(() => {
        const history = localStorage.getItem("rfp_history");
        if (history) {
            try {
                const parsed = JSON.parse(history);
                setProjects(parsed);
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);



    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Welcome Section */}
            <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Welcome back, John Doe</h2>
                <p style={{ color: "var(--text-muted)" }}>Here's what's happening with your projects today.</p>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem",
                borderBottom: "1px solid var(--border-color)"
                                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ padding: "0.5rem", backgroundColor: "var(--bg-app)", borderRadius: "8px" }}>
                        <FileText size={20} color="var(--text-muted)" />
                    </div>
                    <div>
                        <div style={{ fontWeight: "500" }}>{project.originalName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {new Date(project.uploadTime).toLocaleDateString()} • {(project.size / 1024).toFixed(1)} KB
                        </div>
                    </div>
                </div>
            </div>
                            ))}
        </div>
    )
}
                </div >
            </div >
        </div >
    );
}
