import React from 'react';
import { getAdminCategories } from '../actions';
import { ProductForm } from '../../../../components/admin/product-form';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="py-2">
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
