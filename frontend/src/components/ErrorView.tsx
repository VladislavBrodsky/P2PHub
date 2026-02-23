import { useTranslation } from 'react-i18next';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export const ErrorView = ({ featureName, onRetry, error }: { featureName: string; onRetry: () => void; error: Error | null }) => {
    const { t } = useTranslation('common');

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900/50 rounded-2xl border border-slate-800 backdrop-blur-sm min-h-[300px]">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
                {t('system.error.unavailable', { feature: featureName })}
            </h3>
            <p className="text-slate-400 mb-6 max-w-sm">
                {t('system.error.desc')}
            </p>
            <button
                onClick={onRetry}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95"
            >
                <RefreshCcw className="w-4 h-4" />
                {t('system.error.retry')}
            </button>
            {import.meta.env.DEV && (
                <div className="mt-6 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-left w-full max-w-md overflow-x-auto">
                    <p className="text-xs font-mono text-red-400 wrap-break-word whitespace-pre-wrap">
                        {error?.toString()}
                    </p>
                </div>
            )}
        </div>
    );
};
