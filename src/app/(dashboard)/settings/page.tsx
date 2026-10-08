import { SettingsClientPage } from './client-page';
import { getOrgSettings, getPipelineStages } from './actions';

export const metadata = {
    title: 'Configurações | CRM Infodive',
};

export default async function SettingsPage() {
    const [orgSettings, initialStages] = await Promise.all([
        getOrgSettings().catch(() => ({ name: '', support_email: '' })),
        getPipelineStages().catch(() => [])
    ]);

    return <SettingsClientPage initialOrgSettings={orgSettings} initialStages={initialStages} />;
}
