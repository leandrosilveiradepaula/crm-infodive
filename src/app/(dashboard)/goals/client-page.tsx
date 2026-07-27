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
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="mb-6 w-full justify-start overflow-x-auto no-scrollbar">
                    <TabsTrigger value="goals">
                        <Target className="h-4 w-4" /> Metas de Vendas
                    </TabsTrigger>
                    <TabsTrigger value="commissions">
                        <Calculator className="h-4 w-4" /> Regras de Comissão
                    </TabsTrigger>
                    <TabsTrigger value="campaigns">
                        <Megaphone className="h-4 w-4" /> Gestão de Campanhas
                    </TabsTrigger>
                    <TabsTrigger value="planning">
                        <TrendingUp className="h-4 w-4" /> Planejamento Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="statement">
                        <FileText className="h-4 w-4" /> Extrato de Comissões
                    </TabsTrigger>
                </TabsList>

                {/* Content Area */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-4 min-h-[600px]">
                    <TabsContent value="goals" className="mt-0 outline-none">
                        <GoalsTab users={userData} deals={statementDeals} />
                    </TabsContent>
                    <TabsContent value="commissions" className="mt-0 outline-none">
                        <CommissionsTab users={userData} />
                    </TabsContent>
                    <TabsContent value="campaigns" className="mt-0 outline-none">
                        <CampaignsTab campaigns={campaigns} />
                    </TabsContent>
                    <TabsContent value="planning" className="mt-0 outline-none">
                        <PlanningTab scenarios={scenarios} currentUserId={currentUserId} users={userData} />
                    </TabsContent>
                    <TabsContent value="statement" className="mt-0 outline-none">
                        <StatementTab deals={statementDeals} users={userData} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
