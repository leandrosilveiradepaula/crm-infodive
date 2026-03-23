import { Suspense } from 'react';
import { getDashboardMetrics, getRecentDeals, getUpcomingTasks, getDashboardDeals } from './actions';
import { DashboardClientPage } from './client-page';

export default async function DashboardPage() {
    const [metrics, recentDeals, tasks, allDeals] = await Promise.all([
        getDashboardMetrics(),
        getRecentDeals(),
        getUpcomingTasks(),
        getDashboardDeals()
    ]);

    return (
        <Suspense fallback={<div className="text-white p-8">Carregando dashboard...</div>}>
            <DashboardClientPage
                initialMetrics={metrics}
                initialRecentDeals={recentDeals}
                initialTasks={tasks}
                initialDeals={allDeals}
            />
        </Suspense>
    );
}
