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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface GoalsClientPageProps {
    userData: UserGoalData[];
    campaigns: Campaign[];
    scenarios: Scenario[];
    statementDeals: Deal[];
    currentUserId: string;
}

export function GoalsCommissionsClientPage({
    userData,
    campaigns,
    scenarios,
    statementDeals,
    currentUserId
}: GoalsClientPageProps) {

    return (
        <div className="animate-in fade-in duration-500 pb-10 space-y-8">
            

            <Tabs defaultValue="goals">
                <TabsList className="w-full overflow-x-auto no-scrollbar">
                    <TabsTrigger value="goals">
                        <Target className="h-4 w-4" />
                        Metas de Vendas
                    </TabsTrigger>
                    <TabsTrigger value="commissions">
                        <Calculator className="h-4 w-4" />
                        Regras de Comissão
                    </TabsTrigger>
                    <TabsTrigger value="campaigns">
                        <Megaphone className="h-4 w-4" />
                        Gestão de Campanhas
                    </TabsTrigger>
                    <TabsTrigger value="planning">
                        <TrendingUp className="h-4 w-4" />
                        Planejamento Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="statement">
                        <FileText className="h-4 w-4" />
                        Extrato de Comissões
                    </TabsTrigger>
                </TabsList>

                <div className="bg-card rounded-3xl shadow-2xl border border-border p-8 min-h-[600px] mt-6">
                    <TabsContent value="goals" className="m-0">
                        <GoalsTab users={userData} />
                    </TabsContent>
                    <TabsContent value="commissions" className="m-0">
                        <CommissionsTab users={userData} />
                    </TabsContent>
                    <TabsContent value="campaigns" className="m-0">
                        <CampaignsTab campaigns={campaigns} />
                    </TabsContent>
                    <TabsContent value="planning" className="m-0">
                        <PlanningTab scenarios={scenarios} currentUserId={currentUserId} users={userData} />
                    </TabsContent>
                    <TabsContent value="statement" className="m-0">
                        <StatementTab deals={statementDeals} users={userData} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
