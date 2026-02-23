import React from 'react';

// ── Inline USDT (Tether) logo (Optimized) ──────────────────────
export const USDTLogo = React.memo(({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 32 32" fill="currentColor">
        <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" />
    </svg>
));

USDTLogo.displayName = 'USDTLogo';

// ── Inline TON (The Open Network) logo (Optimized 3D Faceted) ───────────────
export const TONLogo = React.memo(({ className, style }: { className?: string; style?: React.CSSProperties }) => (
    <svg className={className} style={style} viewBox="0 0 56 56" fill="currentColor">
        <path d="M37.6,15.6H18.4c-3.5,0-5.7,3.8-4,6.9l11.8,20.5c0.8,1.3,2.7,1.3,3.5,0l11.8-20.5C43.3,19.4,41.1,15.6,37.6,15.6z" />
        <path d="M26.3,36.8l-2.6-5l-6.2-11.1c-0.4-0.7,0.1-1.6,1-1.6h7.8L26.3,36.8L26.3,36.8z" fill="white" fillOpacity="0.3" />
        <path d="M38.5,20.7l-6.2,11.1l-2.6,5V19.1h7.8C38.4,19.1,38.9,20,38.5,20.7z" fill="white" fillOpacity="0.3" />
    </svg>
));

TONLogo.displayName = 'TONLogo';
