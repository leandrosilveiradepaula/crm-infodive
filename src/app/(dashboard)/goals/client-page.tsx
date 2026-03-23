'use client';

import { useState } from 'react';
import { Target, Calculator, Megaphone, TrendingUp, FileText } from 'lucide-react';
import { GoalsTab } from '@/components/goals/tabs/GoalsTab';
import { CommissionsTab } from '@/components/goals/tabs/CommissionsTab';
import { CampaignsTab } from '@/components/goals/tabs/CampaignsTab';
import { PlanningTab } from '@/components/goals/tabs/PlanningTab';
import { StatementTab } from '@/components/goals/tabs/StatementTab';
import { UserGoalData, Campaign, Scenario } from '@/types/goal';
import { Deal } from '@/types/deal';
import { PageHeader } from '@/components/layout/PageHeader';

interface GoalsClientPageProps {
    userData: UserGoalData[]; // All users relevant data
    campaigns: Campaign[];
    scenarios: Scenario[];
    statementDeals: Deal[];
    currentUserId: string; // For planning module saving
}

export function GoalsClientPage({
    userData,
    campaigns,
    scenarios,
    statementDeals,
    currentUserId
}: GoalsClientPageProps) {
    const [activeTab, setActiveTab] = useState<'goals' | 'commissions' | 'campaigns' | 'planning' | 'statement'>('goals');

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500">
            <PageHeader 
                title="Metas e Comissões" 
                description="Gerencie as metas mensais e regras de comissionamento da equipe." 
            />

            {/* Navigation Tabs */}
            <div className="flex gap-1 border-b border-border p-1 bg-card/50 rounded-2xl backdrop-blur-sm overflow-x-auto">
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`flex-1 min-w-[150px] py-3 px-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'goals'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <Target className="h-4 w-4" />
                    Metas de Vendas
                </button>
                <button
                    onClick={() => setActiveTab('commissions')}
                    className={`flex-1 min-w-[150px] py-3 px-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'commissions'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <Calculator className="h-4 w-4" />
                    Regras de Comissão
                </button>
                <button
                    onClick={() => activeTab !== 'campaigns' && setActiveTab('campaigns')}
                    className={`flex-1 min-w-[150px] py-3 px-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'campaigns'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <Megaphone className="h-4 w-4" />
                    Gestão de Campanhas
                </button>
                <button
                    onClick={() => setActiveTab('planning')}
                    className={`flex-1 min-w-[150px] py-3 px-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'planning'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <TrendingUp className="h-4 w-4" />
                    Planejamento Financeiro
                </button>
                <button
                    onClick={() => setActiveTab('statement')}
                    className={`flex-1 min-w-[150px] py-3 px-4 text-xs font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'statement'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                >
                    <FileText className="h-4 w-4" />
                    Extrato de Comissões
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-card rounded-3xl shadow-2xl border border-border p-8 min-h-[600px]">
                {activeTab === 'goals' && (
                    <GoalsTab users={userData} deals={statementDeals} />
                )}
                {activeTab === 'commissions' && (
                    <CommissionsTab users={userData} />
                )}
                {activeTab === 'campaigns' && (
                    <CampaignsTab campaigns={campaigns} />
                )}
                {activeTab === 'planning' && (
                    <PlanningTab scenarios={scenarios} currentUserId={currentUserId} users={userData} />
                )}
                {activeTab === 'statement' && (
                    <StatementTab deals={statementDeals} users={userData} />
                )}
            </div>
        </div>
    );
}
