import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-10 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <span className="text-4xl text-red-500">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-black mb-4 uppercase tracking-tighter">Something went wrong</h1>
                    <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
                        The mission encountered an unexpected error. Don't worry, your progress is safe.
                    </p>

                    <button
                        onClick={this.handleReload}
                        className="w-full max-w-xs h-14 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        Reload App
                    </button>

                    {import.meta.env.DEV && (
                        <div className="mt-10 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-left overflow-auto max-w-full">
                            <p className="text-xs font-mono text-red-400">{this.state.error?.toString()}</p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
