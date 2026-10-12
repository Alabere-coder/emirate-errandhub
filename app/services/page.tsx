import { getActiveServiceCategoryTree } from "@/lib/services/categories";
import ServicesExplorer from "@/components/services/services-explorer";
import { PublicNavbar } from "@/components/navigation/public-navbar";

export default async function ServicesPage() {
  const categories = await getActiveServiceCategoryTree();

  return (
    <>
      <PublicNavbar />
      <ServicesExplorer categories={categories} />
    </>
  );
}
