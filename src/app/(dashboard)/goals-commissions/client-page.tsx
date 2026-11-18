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
        <div className="space-y-6 pb-10">
            <PageHeader 
                title="Metas e Comissões" 
                description="Gerencie as metas mensais e regras de comissionamento da equipe." 
            />

            <Tabs defaultValue="goals">
                <TabsList className="flex h-auto w-full flex-col items-stretch gap-1 p-2 sm:grid sm:grid-cols-2 xl:flex xl:flex-row xl:flex-wrap xl:justify-start">
                    <TabsTrigger value="goals" className="min-h-10 w-full min-w-0 justify-start whitespace-normal text-left sm:justify-center xl:w-auto">
                        <Target className="h-4 w-4" />
                        Metas de Vendas
                    </TabsTrigger>
                    <TabsTrigger value="commissions" className="min-h-10 w-full min-w-0 justify-start whitespace-normal text-left sm:justify-center xl:w-auto">
                        <Calculator className="h-4 w-4" />
                        Regras de Comissão
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="min-h-10 w-full min-w-0 justify-start whitespace-normal text-left sm:justify-center xl:w-auto">
                        <Megaphone className="h-4 w-4" />
                        Gestão de Campanhas
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="min-h-10 w-full min-w-0 justify-start whitespace-normal text-left sm:justify-center xl:w-auto">
                        <TrendingUp className="h-4 w-4" />
                        Planejamento Financeiro
                    </TabsTrigger>
                    <TabsTrigger value="statement" className="min-h-10 w-full min-w-0 justify-start whitespace-normal text-left sm:justify-center xl:w-auto">
                        <FileText className="h-4 w-4" />
                        Extrato de Comissões
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6 min-h-[600px] rounded-[var(--radius-panel)] border border-border bg-card p-4 shadow-[var(--shadow-card)] md:p-6">
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
