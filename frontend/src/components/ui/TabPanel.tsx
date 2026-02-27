import React, { Suspense, createContext, useContext } from 'react';
import { FeatureErrorBoundary } from '../FeatureErrorBoundary';

interface TabPanelProps {
    id: string;
    activeTab: string;
    visitedTabs: Set<string>;
    fallback?: React.ReactNode;
    featureName?: string;
    children: React.ReactNode;
}

const TabActiveContext = createContext<boolean>(false);

export const useTabActive = () => useContext(TabActiveContext);

/**
 * TabPanel - Centralized component for conditional tab rendering.
 * 
 * Handles mounting logic (visited check), visibility (hidden/block),
 * and wraps contents in an ErrorBoundary and Suspense.
 */
export const TabPanel = React.memo(({
    id,
    activeTab,
    visitedTabs,
    fallback,
    featureName,
    children
}: TabPanelProps) => {
    const isActive = activeTab === id;
    const hasVisited = visitedTabs.has(id);

    if (!hasVisited && !isActive) return null;

    return (
        <TabActiveContext.Provider value={isActive}>
            <div className={isActive ? 'block relative' : 'hidden'} id={`tab-panel-${id}`}>
                <FeatureErrorBoundary featureName={featureName || id}>
                    <Suspense fallback={fallback || null}>
                        {children}
                    </Suspense>
                </FeatureErrorBoundary>
            </div>
        </TabActiveContext.Provider>
    );
});

TabPanel.displayName = 'TabPanel';
