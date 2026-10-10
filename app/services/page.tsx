import { getActiveServiceCategoryTree } from "@/lib/services/categories";
import ServicesExplorer from "@/components/services/services-explorer";

export default async function ServicesPage() {
  const categories = await getActiveServiceCategoryTree();

  return <ServicesExplorer categories={categories} />;
}
