import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToEvent } from '../services/socket';
import './WaiterCalls.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const WaiterCalls = () => {
    const [pendingCalls, setPendingCalls] = useState([]);
    const [historysCalls, setHistoryCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    const fetchCalls = async () => {
        try {
            const [pendingRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/waiter-calls`),
                fetch(`${API_URL}/waiter-calls?status=resolved`)
            ]);
            const pending = await pendingRes.json();
            const history = await historyRes.json();
            setPendingCalls(Array.isArray(pending) ? pending : []);
            setHistoryCalls(Array.isArray(history) ? history : []);
        } catch (err) {
            console.error('Erro ao buscar chamadas:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls();

        const unsubCall = subscribeToEvent('CALL_WAITER', (payload) => {
            setPendingCalls((prev) => [payload, ...prev]);
        });

        const unsubResolved = subscribeToEvent('WAITER_CALL_RESOLVED', (payload) => {
            setPendingCalls((prev) => prev.filter((c) => c.id !== payload.id));
            fetchCalls(); // Refresh history
        });

        return () => {
            unsubCall();
            unsubResolved();
        };
    }, []);

    const resolveCall = async (id) => {
        try {
            await fetch(`${API_URL}/waiter-calls/${id}/resolve`, { method: 'PUT' });
            setPendingCalls((prev) => prev.filter((c) => c.id !== id));
            fetchCalls();
        } catch (err) {
            console.error('Erro ao resolver chamada:', err);
        }
    };

    const getReasonIcon = (reason) => {
        if (!reason) return '🔔';
        if (reason.includes('Conta')) return '💳';
        if (reason.includes('Limpeza') || reason.includes('Guardanapo')) return '🧹';
        if (reason.includes('Dúvida') || reason.includes('Menu')) return '❓';
        return '🔔';
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
        if (diff < 60) return `${diff}s atrás`;
        if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
        return `${Math.floor(diff / 3600)}h atrás`;
    };

    // Statistics
    const stats = useMemo(() => {
        const allCalls = [...pendingCalls, ...historysCalls];
        const reasonCounts = {};
        allCalls.forEach(c => {
            const r = c.reason || 'Outros';
            reasonCounts[r] = (reasonCounts[r] || 0) + 1;
        });
        return {
            total: allCalls.length,
            pending: pendingCalls.length,
            resolved: historysCalls.length,
            byReason: Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])
        };
    }, [pendingCalls, historysCalls]);

    if (loading) {
        return <div className="waiter-calls-loading">Carregando...</div>;
    }

    const displayCalls = activeTab === 'pending' ? pendingCalls : historysCalls;

    return (
        <div className="waiter-calls-container">
            <h1>🔔 Chamadas de Garçom</h1>

            {/* Stats Cards */}
            <div className="stats-row">
                <div className="stat-card pending">
                    <span className="stat-value">{stats.pending}</span>
                    <span className="stat-label">Pendentes</span>
                </div>
                <div className="stat-card resolved">
                    <span className="stat-value">{stats.resolved}</span>
                    <span className="stat-label">Atendidas Hoje</span>
                </div>
                <div className="stat-card total">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total</span>
                </div>
            </div>

            {/* Reason Stats */}
            {stats.byReason.length > 0 && (
                <div className="reason-stats">
                    <h3>Motivos Mais Frequentes</h3>
                    <div className="reason-bars">
                        {stats.byReason.slice(0, 4).map(([reason, count]) => (
                            <div key={reason} className="reason-bar-item">
                                <span className="reason-label">{getReasonIcon(reason)} {reason}</span>
                                <div className="reason-bar">
                                    <div className="reason-bar-fill" style={{ width: `${(count / stats.total) * 100}%` }}></div>
                                </div>
                                <span className="reason-count">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    🔴 Pendentes ({pendingCalls.length})
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    ✅ Histórico ({historysCalls.length})
                </button>
            </div>

            {displayCalls.length === 0 ? (
                <div className="no-calls">
                    <span className="no-calls-icon">{activeTab === 'pending' ? '✅' : '📋'}</span>
                    <p>{activeTab === 'pending' ? 'Nenhuma chamada pendente' : 'Nenhum histórico disponível'}</p>
                </div>
            ) : (
                <div className="calls-grid">
                    {displayCalls.map((call) => (
                        <div key={call.id} className={`call-card ${activeTab === 'history' ? 'resolved' : ''}`}>
                            <div className="call-header">
                                <span className="call-table">Mesa {call.table_number}</span>
                                <span className="call-time">{getTimeAgo(call.created_at)}</span>
                            </div>
                            <div className="call-reason">
                                <span className="reason-icon">{getReasonIcon(call.reason)}</span>
                                <span className="reason-text">{call.reason || 'Chamado Geral'}</span>
                            </div>
                            {activeTab === 'pending' && (
                                <button className="resolve-btn" onClick={() => resolveCall(call.id)}>
                                    ✅ Atendido
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WaiterCalls;
