import { useState } from "react";
import { FileText } from "lucide-react";

interface LoginProps {
    onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (email === "demo@example.com" && password === "password") {
            onLogin();
        } else {
            setError("Invalid email or password");
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            fontFamily: "'Inter', sans-serif",
            padding: "1rem",
        }}>
            <div className="card" style={{
                width: "100%",
                maxWidth: "400px",
                padding: "2rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                backgroundColor: "white",
                borderRadius: "1rem",
            }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
                    <div style={{
                        width: "48px",
                        height: "48px",
                        backgroundColor: "#6B5FFF", // Updated to match mockup primary color
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        marginBottom: "1rem",
                    }}>
                        <FileText size={28} />
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#111827", margin: "0 0 0.5rem 0" }}>
                        AI Project Planner
                    </h1>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280", margin: 0 }}>
                        Sign in to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            style={{
                                width: "100%",
                                padding: "0.5rem 0.75rem", // Adjusted padding
                                borderRadius: "0.375rem", // rounded-md (6px)
                                border: "1px solid #e2e8f0", // Lighter border
                                backgroundColor: "white",
                                fontSize: "0.875rem",
                                outline: "none",
                                transition: "border-color 0.2s",
                                boxSizing: "border-box",
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151", marginBottom: "0.5rem" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                width: "100%",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.375rem", // rounded-md
                                border: "1px solid #e2e8f0",
                                backgroundColor: "white",
                                fontSize: "0.875rem",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: "#fee2e2",
                            color: "#991b1b",
                            padding: "0.75rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.875rem",
                            marginBottom: "1.5rem",
                            textAlign: "center",
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            padding: "0.5rem 1rem",
                            backgroundColor: "#6B5FFF", // Mockup color
                            color: "white",
                            border: "none",
                            borderRadius: "9999px", // rounded-full
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            opacity: isLoading ? 0.7 : 1,
                            transition: "background-color 0.2s",
                            height: "36px", // h-9
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#5850E6"}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#6B5FFF"}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
