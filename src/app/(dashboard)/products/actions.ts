'use server';

import { revalidatePath } from 'next/cache';
import { type Product } from '@/types/product';
import { ProductService } from '@/services/ProductService';
import { requireSessionContext } from '@/lib/auth-server';
import { AccountService } from '@/services/AccountService';

export async function getProducts(): Promise<Product[]> {
    const { userId, organizationId } = await requireSessionContext();
    return await ProductService.getProducts(userId, organizationId);
}

export async function getManufacturers() {
    const { userId, organizationId } = await requireSessionContext();
    return await AccountService.getManufacturers(userId, organizationId);
}

export async function createProduct(product: Partial<Product>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ProductService.createProduct(userId, organizationId, product);
    if (result.success) revalidatePath('/products');
    return result;
}

export async function updateProduct(id: string, updates: Partial<Product>) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ProductService.updateProduct(userId, id, organizationId, updates);
    if (result.success) revalidatePath('/products');
    return result;
}

export async function deleteProduct(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ProductService.deleteProduct(userId, id, organizationId);
    if (result.success) revalidatePath('/products');
    return result;
}

export async function duplicateProduct(id: string) {
    const { userId, organizationId } = await requireSessionContext();
    const result = await ProductService.duplicateProduct(userId, organizationId, id);
    if (result.success) revalidatePath('/products');
    return result;
}

