import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, ShieldCheck, RefreshCw, User, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';
import { useUser } from '../context/UserContext';

interface Transaction {
    id: number;
    partner_id: number;
    amount: number;
    currency: string;
    network: string;
    tx_hash: string;
    status: string;
    created_at: string;
}

export const AdminPage = () => {
    const { user } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvingIds, setApprovingIds] = useState<Set<number>>(new Set());

    const fetchPending = async (silent = false) => {
        if (!silent) setIsLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/api/admin/pending-payments');
            setTransactions(res.data);
        } catch (err: any) {
            console.error('[Admin] Fetch failed:', err);
            setError(err.response?.data?.detail || 'Failed to load pending payments');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (txId: number) => {
        if (approvingIds.has(txId)) return;

        setApprovingIds(prev => new Set(prev).add(txId));
        try {
            await apiClient.post(`/api/admin/approve-payment/${txId}`);
            // Success - refresh list
            await fetchPending(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Approval failed');
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(txId);
                return next;
            });
        }
    };

    const handleReject = async (txId: number) => {
        if (!confirm('Are you sure you want to reject this transaction? The user will be notified.')) return;

        try {
            await apiClient.post(`/api/admin/reject-payment/${txId}`);
            await fetchPending(true);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Rejection failed');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-500 font-medium">Authorizing Admin Access...</p>
            </div>
        );
    }

    return (
        <div className="p-4 safe-pb space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.href = '#/'}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 active:scale-95 transition-all"
                    >
                        <RefreshCw size={18} className="rotate-270 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black flex items-center gap-2">
                            <ShieldCheck className="text-blue-500" size={20} />
                            Admin
                        </h1>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Revenue Review</p>
                    </div>
                </div>
                <button
                    onClick={() => { setIsRefreshing(true); fetchPending(true); }}
                    className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <p className="text-red-500 text-sm font-semibold">{error}</p>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-3xl glass-panel-premium space-y-1">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Tasks</div>
                    <div className="text-2xl font-black">{transactions.length}</div>
                </div>
                <div className="p-4 rounded-3xl glass-panel-premium space-y-1">
                    <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">System State</div>
                    <div className="text-sm font-bold text-emerald-500 flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Healthy
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Awaiting Review</h2>
                </div>

                <AnimatePresence mode="popLayout">
                    {transactions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 text-center space-y-3"
                        >
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="text-blue-500" size={32} />
                            </div>
                            <div className="text-slate-500 font-bold">Clear Sky</div>
                            <p className="text-slate-400 text-xs">All payments are up to date</p>
                        </motion.div>
                    ) : (
                        transactions.map((tx) => (
                            <motion.div
                                key={tx.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                className="p-4 rounded-3xl glass-panel-premium border border-white/5 space-y-3"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                            <Clock className="text-amber-500" size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm flex items-center gap-2">
                                                {tx.amount} {tx.currency}
                                                <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-slate-500">
                                                    {tx.network}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                                <User size={10} />
                                                Partner ID: {tx.partner_id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400">
                                            {tx.created_at ? new Date(tx.created_at).toLocaleTimeString() : 'Recently'}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/20 font-mono text-[10px] break-all flex items-start justify-between gap-2 border border-slate-100 dark:border-white/5">
                                    <span className="text-slate-500 shrink-0 uppercase font-black">Hash:</span>
                                    <span className={`select-all ${!tx.tx_hash ? "text-red-400 italic" : "text-slate-600 dark:text-slate-300"}`}>
                                        {tx.tx_hash || "Not Provided (Manual Confirmation)"}
                                    </span>
                                    {tx.tx_hash && (
                                        <a
                                            href={tx.network === 'TON' ? `https://tonviewer.com/transaction/${tx.tx_hash}` : `https://tronscan.org/#/transaction/${tx.tx_hash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-500 shrink-0"
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleReject(tx.id)}
                                        className="py-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-500 font-bold text-sm active:scale-95 transition-all"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(tx.id)}
                                        disabled={approvingIds.has(tx.id)}
                                        className="py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                    >
                                        {approvingIds.has(tx.id) ? (
                                            <>
                                                <RefreshCw className="animate-spin" size={16} />
                                                Wait...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={16} />
                                                Approve
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
