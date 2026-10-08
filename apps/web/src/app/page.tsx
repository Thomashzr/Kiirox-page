import { Suspense } from 'react';
import { Navbar } from '../components/navbar';
import { Hero } from '../components/hero';
import { CatalogSection } from '../components/catalog-section';
import { Footer } from '../components/footer';
import { getStoreData, storeConfig } from '../lib/data';

async function CatalogAsync() {
  const { categories, products, config } = await getStoreData();
  return (
    <CatalogSection
      categories={categories}
      products={products}
      whatsappNumber={config.whatsapp_number}
    />
  );
}

function CatalogSkeleton() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full animate-pulse">
      <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-80 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || storeConfig.whatsapp_number;

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* 1. Header with Logo slot and Clerk auth */}
      <Navbar whatsappNumber={whatsappNumber} />

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col">
        <Hero whatsappNumber={whatsappNumber} />

        {/* 3. Interactive Catalog with Filters and Modal */}
        <Suspense fallback={<CatalogSkeleton />}>
          <CatalogAsync />
        </Suspense>
      </main>

      {/* 4. Minimalist Monochrome Footer */}
      <Footer whatsappNumber={whatsappNumber} />
    </div>
  );
}

