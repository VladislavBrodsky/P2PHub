import { HTMLAttributes } from 'react';

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200/50 dark:bg-slate-700/50 ${className}`}
            {...props}
        />
    );
}
