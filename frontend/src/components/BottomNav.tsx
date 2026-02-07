import { NavButton } from './NavButton';
import { Home, CreditCard, Users, DollarSign, Trophy } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
    return (
        <nav className="glass-panel relative mx-4 mb-6 flex h-16 w-full max-w-[440px] items-center justify-around rounded-3xl px-2 shadow-premium border border-[var(--color-border-glass)]">
            <NavButton
                active={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
                icon={<Home className="h-5 w-5" />}
                label="Home"
            />
            <NavButton
                active={activeTab === 'cards'}
                onClick={() => setActiveTab('cards')}
                icon={<CreditCard className="h-5 w-5" />}
                label="Cards"
            />
            <NavButton
                active={activeTab === 'partner'}
                onClick={() => setActiveTab('partner')}
                icon={<Users className="h-5 w-5" />}
                label="Partner"
            />
            <NavButton
                active={activeTab === 'league'}
                onClick={() => setActiveTab('league')}
                icon={<Trophy className="h-5 w-5" />}
                label="League"
            />
            <NavButton
                active={activeTab === 'earn'}
                onClick={() => setActiveTab('earn')}
                icon={<DollarSign className="h-5 w-5" />}
                label="Earn"
            />
        </nav>
    );
}
