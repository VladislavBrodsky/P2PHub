import React from 'react';
import { MarketAuditModal } from './modals/MarketAuditModal';
import { ArticleReaderModal } from './modals/ArticleReaderModal';
import { ManualsModal } from './modals/ManualsModal';
import { HeadlineFixerModal } from './modals/HeadlineFixerModal';
import { BioGeneratorModal } from './modals/BioGeneratorModal';
import { SetupModal } from './modals/SetupModal';
import { GrowthStrategistModal } from './modals/GrowthStrategistModal';

interface ProModalsProps {
    showAuditModal: boolean;
    setShowAuditModal: (show: boolean) => void;
    marketAudit: any;
    setActiveTab: (tab: any) => void;
    selectedArticle: any;
    setSelectedArticle: (article: any) => void;
    showManual: string | null;
    setShowManual: (manual: string | null) => void;
    selection: () => void;
    handleRefreshAudit: () => void;
    isAuditing: boolean;
    showSetup: boolean;
    setShowSetup: (show: boolean) => void;
    status: any;
    showHeadlineModal?: boolean;
    setShowHeadlineModal?: (show: boolean) => void;
    handleFixHeadline?: (headline: string) => Promise<string | undefined>;
    isFixingHeadline?: boolean;
    showBioModal?: boolean;
    setShowBioModal?: (show: boolean) => void;
    handleGenerateBio?: (bio: string) => Promise<string | undefined>;
    isGeneratingBio?: boolean;
    showGrowthModal?: boolean;
    setShowGrowthModal?: (show: boolean) => void;
}

export const ProDashboardModals = ({
    showAuditModal,
    setShowAuditModal,
    marketAudit,
    setActiveTab,
    selectedArticle,
    setSelectedArticle,
    showManual,
    setShowManual,
    selection,
    handleRefreshAudit,
    isAuditing,
    showSetup,
    setShowSetup,
    status,
    showHeadlineModal,
    setShowHeadlineModal,
    handleFixHeadline,
    isFixingHeadline,
    showBioModal,
    setShowBioModal,
    handleGenerateBio,
    isGeneratingBio,
    showGrowthModal,
    setShowGrowthModal
}: ProModalsProps) => {
    return (
        <>
            <SetupModal
                showSetup={showSetup}
                setShowSetup={setShowSetup}
                status={status}
                selection={selection}
            />

            <MarketAuditModal
                showAuditModal={showAuditModal}
                setShowAuditModal={setShowAuditModal}
                marketAudit={marketAudit}
                handleRefreshAudit={handleRefreshAudit}
                isAuditing={isAuditing}
                setActiveTab={setActiveTab}
                selection={selection}
            />

            <ArticleReaderModal
                selectedArticle={selectedArticle}
                setSelectedArticle={setSelectedArticle}
                selection={selection}
            />

            <ManualsModal
                showManual={showManual}
                setShowManual={setShowManual}
                selection={selection}
            />

            <HeadlineFixerModal
                showHeadlineModal={!!showHeadlineModal}
                setShowHeadlineModal={(show) => setShowHeadlineModal?.(show)}
                handleFixHeadline={handleFixHeadline}
                isFixingHeadline={isFixingHeadline}
                proTokens={status?.pro_tokens ?? 0}
            />

            <BioGeneratorModal
                showBioModal={!!showBioModal}
                setShowBioModal={(show) => setShowBioModal?.(show)}
                handleGenerateBio={handleGenerateBio}
                isGeneratingBio={isGeneratingBio}
                proTokens={status?.pro_tokens ?? 0}
            />

            <GrowthStrategistModal
                isOpen={!!showGrowthModal}
                onClose={() => setShowGrowthModal?.(false)}
            />
        </>
    );
};
