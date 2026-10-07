import { Navbar } from '../components/navbar';
import { Hero } from '../components/hero';
import { CatalogSection } from '../components/catalog-section';
import { Footer } from '../components/footer';
import { getStoreData } from '../lib/data';


export default async function HomePage() {
  const { categories, products, config } = await getStoreData();

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* 1. Header with Logo slot and Clerk auth */}
      <Navbar whatsappNumber={config.whatsapp_number} />

      {/* 2. Hero Section */}
      <main className="flex-1 flex flex-col">
        <Hero whatsappNumber={config.whatsapp_number} />

        {/* 3. Interactive Catalog with Filters and Modal */}
        <CatalogSection
          categories={categories}
          products={products}
          whatsappNumber={config.whatsapp_number}
        />
      </main>

      {/* 4. Minimalist Monochrome Footer */}
      <Footer whatsappNumber={config.whatsapp_number} />
    </div>
  );
}
