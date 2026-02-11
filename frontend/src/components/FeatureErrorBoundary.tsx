import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
    featureName: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class FeatureErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[FeatureErrorBoundary] Error in ${this.props.featureName}:`, error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm min-h-[300px]">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        {this.props.featureName} Unavailable
                    </h3>
                    <p className="text-slate-400 mb-6 max-w-sm">
                        We encountered an issue loading this section. The rest of the app is working fine.
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Try Again
                    </button>
                    {import.meta.env.DEV && (
                        <div className="mt-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-left w-full max-w-md overflow-x-auto">
                            <p className="text-xs font-mono text-red-400 break-words whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
