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
            primary: "bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover shadow-premium",
            secondary: "bg-btn-secondary-bg text-btn-secondary-text border border-card-border hover:bg-btn-secondary-hover",
            danger: "bg-error text-white hover:brightness-110",
            ghost: "text-text-primary hover:bg-bg-surface"
        };

        const sizes = {
            sm: "text-label h-9 px-3",
            md: "text-caption h-12 px-5",
            lg: "text-body h-14 px-8"
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
