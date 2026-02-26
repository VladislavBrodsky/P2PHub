import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorView } from './ErrorView';
import * as Sentry from '@sentry/react';

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
        Sentry.captureException(error, {
            extra: { featureName: this.props.featureName, ...errorInfo },
        });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return <ErrorView featureName={this.props.featureName} onRetry={this.handleRetry} error={this.state.error} />;
        }

        return this.props.children;
    }
}
