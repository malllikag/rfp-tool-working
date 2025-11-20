import { Link } from "react-router-dom";
import { Folder, Clock, CheckCircle, Plus } from "lucide-react";

export default function Dashboard() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                    Welcome back, John Doe
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {/* Card 1 */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(107, 95, 255, 0.1)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Folder size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>12</div>
                            <div style={{ color: 'var(--text-muted)' }}>Total Projects</div>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            color: '#f97316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>3</div>
                            <div style={{ color: 'var(--text-muted)' }}>In Progress</div>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>9</div>
                            <div style={{ color: 'var(--text-muted)' }}>Completed</div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--text-muted)' }}>Recent Activity</h3>

                <div className="card" style={{ padding: '0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Item 1 */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Enterprise Software System</div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
                                    <span style={{
                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                        color: '#22c55e',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontWeight: '500'
                                    }}>Completed</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Oct 28, 2025</span>
                                </div>
                            </div>
                            <button className="btn btn-outline" style={{ border: 'none', color: 'var(--primary)' }}>View</button>
                        </div>

                        {/* Item 2 */}
                        <div style={{
                            padding: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Customer Portal Development</div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.875rem' }}>
                                    <span style={{
                                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                        color: '#f97316',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontWeight: '500'
                                    }}>In Progress</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Oct 25, 2025</span>
                                </div>
                            </div>
                            <button className="btn btn-outline" style={{ border: 'none', color: 'var(--primary)' }}>View</button>
                        </div>
                    </div>
                </div>
            </section>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <Link to="/create" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                    <Plus size={20} />
                    Create New RFP Project
                </Link>
            </div>
        </div>
    );
}
