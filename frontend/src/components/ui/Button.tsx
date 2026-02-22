import * as React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

        const variants = {
            primary: "bg-(--color-btn-primary-bg) text-(--color-btn-primary-text) hover:bg-(--color-btn-primary-hover) shadow-premium",
            secondary: "bg-(--color-btn-secondary-bg) text-(--color-btn-secondary-text) border border-(--color-card-border) hover:bg-(--color-btn-secondary-hover)",
            danger: "bg-(--color-error) text-white hover:brightness-110",
            ghost: "text-(--color-text-primary) hover:bg-(--color-bg-surface)"
        };

        const sizes = {
            sm: "h-9 px-3 text-(--text-label)",
            md: "h-12 px-5 text-(--text-caption)",
            lg: "h-14 px-8 text-(--text-body)"
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <div className="mr-2">{leftIcon}</div>}
                {children}
                {!isLoading && rightIcon && <div className="ml-2">{rightIcon}</div>}
            </button>
        );
    }
);

Button.displayName = "Button";
