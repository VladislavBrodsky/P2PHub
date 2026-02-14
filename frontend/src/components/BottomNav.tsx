import { NavButton } from './NavButton';
import { Home, CreditCard, Users, DollarSign, Trophy } from 'lucide-react';
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
        <nav className="glass-panel relative mx-4 mb-6 flex h-16 w-full max-w-[440px] items-center justify-around rounded-3xl px-2 shadow-premium border border-white/20">
            <NavButton
                active={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
                onMouseEnter={() => prefetch('home')}
                icon={<Home className="h-5 w-5" />}
                label={t('nav.home')}
            />
            <NavButton
                active={activeTab === 'cards'}
                onClick={() => setActiveTab('cards')}
                onMouseEnter={() => prefetch('cards')}
                icon={<CreditCard className="h-5 w-5" />}
                label={t('nav.cards')}
            />
            <NavButton
                active={activeTab === 'partner'}
                onClick={() => setActiveTab('partner')}
                onMouseEnter={() => prefetch('partner')}
                icon={<Users className="h-5 w-5" />}
                label={t('nav.partner')}
            />
            <NavButton
                active={activeTab === 'league'}
                onClick={() => setActiveTab('league')}
                onMouseEnter={() => prefetch('league')}
                icon={<Trophy className="h-5 w-5" />}
                label={t('nav.league')}
            />
            <NavButton
                active={activeTab === 'earn'}
                onClick={() => setActiveTab('earn')}
                onMouseEnter={() => prefetch('earn')}
                icon={<DollarSign className="h-5 w-5" />}
                label={t('nav.earn')}
            />
        </nav>
    );
}
