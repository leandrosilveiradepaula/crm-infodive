import { getAccounts } from './actions';
import CustomersClientPage from './client-page';

export default async function CustomersPage() {
    const accounts = await getAccounts();

    return <CustomersClientPage initialAccounts={accounts} />;
}
