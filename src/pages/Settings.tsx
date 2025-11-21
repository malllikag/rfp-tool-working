import { useState } from "react";
import { Mail, Users, MessageSquare } from "lucide-react";

export default function Settings() {
    const [autoDetect, setAutoDetect] = useState(false);
    const [teamsNotif, setTeamsNotif] = useState(false);
    const [slackNotif, setSlackNotif] = useState(false);

    const handleSave = () => {
        localStorage.setItem("settings", JSON.stringify({ autoDetect, teamsNotif, slackNotif }));
        alert("Settings saved successfully!");
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "900px" }}>
            {/* Email Integration */}
            <div style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <Mail size={24} color="#6366f1" />
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600" }}>Email Integration</h3>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <span className="label-text">Auto-detect RFP emails</span>
                        <label className="toggle">
                            <input type="checkbox" checked={autoDetect} onChange={() => setAutoDetect(!autoDetect)} />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <button className="btn btn-secondary">Connect Gmail</button>
                        <button className="btn btn-secondary">Connect Outlook</button>
                    </div>
                </div>
            </div>

            {/* Teams Integration */}
            <div style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <Users size={24} color="#6366f1" />
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600" }}>Teams Integration</h3>
                </div>

                <button className="btn btn-secondary" style={{ width: "100%", marginBottom: "1rem" }}>
                    Connect Microsoft Teams
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="label-text">Enable notifications</span>
                    <label className="toggle">
                        <input type="checkbox" checked={teamsNotif} onChange={() => setTeamsNotif(!teamsNotif)} />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            {/* Slack Integration */}
            <div style={{
                backgroundColor: "white",
                borderRadius: "12px",
                padding: "2rem",
                marginBottom: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                    <MessageSquare size={24} color="#6366f1" />
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "600" }}>Slack Integration</h3>
                </div>

                <button className="btn btn-secondary" style={{ width: "100%", marginBottom: "1rem" }}>
                    Connect Slack Workspace
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="label-text">Enable notifications</span>
                    <label className="toggle">
                        <input type="checkbox" checked={slackNotif} onChange={() => setSlackNotif(!slackNotif)} />
                        <span className="slider"></span>
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={handleSave} className="btn btn-primary" style={{ padding: "0.75rem 2.5rem" }}>
                    Save Settings
                </button>
            </div>
        </div>
    );
}
