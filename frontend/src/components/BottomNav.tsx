import { NavButton } from './NavButton';
import { Home, CreditCard, Users, Zap, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    prefetchPages?: Record<string, () => Promise<any>>;
}

export default function BottomNav({ activeTab, setActiveTab, prefetchPages }: BottomNavProps) {
    const { t } = useTranslation();

    const prefetch = (tab: string) => {
        if (prefetchPages && prefetchPages[tab]) {
            prefetchPages[tab]();
        }
    };

    return (
        <nav className="relative mx-4 flex h-(--bottom-nav-height,80px) w-full max-w-[440px] items-center justify-around rounded-2xl px-2 bg-bg-glass backdrop-blur-xl border border-border-glass shadow-premium-lg overflow-hidden">

            <NavButton
                active={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
                onMouseEnter={() => prefetch('home')}
                icon={<Home className="h-5 w-5" />}
                label={t('navigation.home')}
            />
            <NavButton
                active={activeTab === 'cards'}
                onClick={() => setActiveTab('cards')}
                onMouseEnter={() => prefetch('cards')}
                icon={<CreditCard className="h-5 w-5" />}
                label={t('navigation.cards')}
            />
            <NavButton
                active={activeTab === 'partner'}
                onClick={() => setActiveTab('partner')}
                onMouseEnter={() => prefetch('partner')}
                icon={<Users className="h-5 w-5" />}
                label={t('navigation.partner')}
            />
            <NavButton
                active={activeTab === 'league'}
                onClick={() => setActiveTab('league')}
                onMouseEnter={() => prefetch('league')}
                icon={<Trophy className="h-5 w-5" />}
                label={t('navigation.league')}
            />
            <NavButton
                active={activeTab === 'earn'}
                onClick={() => setActiveTab('earn')}
                onMouseEnter={() => prefetch('earn')}
                icon={<Zap className="h-5 w-5" />}
                label={t('navigation.earn')}
            />
        </nav>
    );
}
