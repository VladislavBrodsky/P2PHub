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
            primary: "bg-(--color-text-primary) text-(--color-bg-surface) hover:bg-opacity-90 shadow-lg",
            secondary: "bg-(--color-bg-surface) text-(--color-text-primary) border border-(--color-brand-border) hover:bg-(--color-bg-app)",
            danger: "bg-red-500 text-white hover:bg-red-600",
            ghost: "text-(--color-text-primary) hover:bg-(--color-bg-app)"
        };

        const sizes = {
            sm: "h-9 px-3 text-xs",
            md: "h-12 px-5 text-sm",
            lg: "h-14 px-8 text-base"
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
