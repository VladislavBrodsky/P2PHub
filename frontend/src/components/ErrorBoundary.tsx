import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/react";
import i18next from 'i18next';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        eventId: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, eventId: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        const eventId = Sentry.captureException(error, { extra: { ...errorInfo } });
        this.setState({ eventId });
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        const t = (key: string) => i18next.t(key, { ns: 'common' });

        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-10 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <span className="text-4xl text-red-500">⚠️</span>
                    </div>
                    <h1 className="text-2xl font-bold mb-4 uppercase tracking-tighter">
                        {t('error_boundary.title')}
                    </h1>
                    <p className="text-slate-400 text-sm mb-8 max-w-xs leading-relaxed">
                        {t('error_boundary.desc')}
                    </p>

                    <button
                        onClick={this.handleReload}
                        className="w-full max-w-xs h-14 bg-blue-600 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all mb-4"
                    >
                        {t('error_boundary.reload')}
                    </button>

                    {this.state.eventId && (
                        <button
                            onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId! })}
                            className="text-slate-500 text-xs hover:text-white transition-colors uppercase tracking-widest font-bold"
                        >
                            {t('error_boundary.report')}
                        </button>
                    )}

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
