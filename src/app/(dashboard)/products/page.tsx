import { getProducts, getManufacturers } from './actions';
import ProductsClientPage from './client-page';

export default async function ProductsPage() {
    const [products, manufacturers] = await Promise.all([
        getProducts(),
        getManufacturers()
    ]);

    return <ProductsClientPage initialProducts={products} manufacturers={manufacturers} />;
}
