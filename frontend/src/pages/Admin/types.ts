import { LucideIcon } from 'lucide-react';

export interface GrowthStat {
    count: number;
    previous: number;
    percent_change: number;
}

export interface CommissionLine {
    level: number;
    amount: number;
}

export interface RecentSale {
    id: number;
    amount: number;
    currency: string;
    tx_hash: string;
    created_at: string;
    username: string | null;
    telegram_id: string;
}

export interface DashboardStats {
    growth: {
        "24h": GrowthStat;
        "7d": GrowthStat;
        "30d": GrowthStat;
        "90d": GrowthStat;
    };
    daily_growth: { date: string; count: number }[];
    daily_revenue: { date: string; amount: number }[];
    recent_sales: RecentSale[];
    events: {
        total_partners: number;
        total_pro: number;
        total_tasks: number;
        active_24h: number;
        pending_payments_24h: number;
        audit: {
            transactions: Record<string, number>;
            orphaned_count: number;
            is_healthy: boolean;
        };
    };
    kpis: {
        conversion_rate: number;
        arpu: number;
        retention_estimate: number;
        retention_7d: number;
        retention_30d: number;
        retention_90d: number;
        retention_180d: number;
        k_factor: number;
        ref_participation: number;
        engagement_rate: number;
        avg_depth: number;
    };
    financials: {
        total_revenue: number;
        total_revenue_ton: number;
        current_ton_value: number;
        total_revenue_usdt: number;
        total_commissions: number;
        net_profit: number;
        gross_margin: number;
        actual_payout_ratio: number;
        theoretical_payout_ratio: number;
        commissions_breakdown: CommissionLine[];
    };
    performance?: {
        avg_manual_approval_min: number;
        pro_slots_actual: number;
        pro_slots_display: number;
    };
    tasks: Record<string, number>;
    top_partners: { username: string; telegram_id: string; earnings: number }[];
}

export interface Transaction {
    id: number;
    partner_id: number;
    amount: number;
    currency: string;
    network: string;
    tx_hash: string;
    status: string;
    created_at: string;
}
