import { createClient } from "@/lib/supabase/server";

export type ServiceCategoryParent = {
  id: string;
  name: string;
  slug: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  requires_verification: boolean;
  requires_certificate: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceCategoryWithChildren = ServiceCategory & {
  children: ServiceCategoryWithChildren[];
};

/**
 * Get all active top-level service categories.
 */
export async function getActiveServiceCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .is("parent_id", null)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching service categories:", error);
    return [];
  }

  return data as ServiceCategory[];
}

/**
 * Get all active categories including children.
 */
export async function getActiveServiceCategoryTree() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching service category tree:", error);
    return [];
  }

  const categories = data as ServiceCategory[];

  const categoryMap = new Map<string, ServiceCategoryWithChildren>();

  for (const category of categories) {
    categoryMap.set(category.id, {
      ...category,
      children: [],
    });
  }

  const roots: ServiceCategoryWithChildren[] = [];

  for (const category of categories) {
    const current = categoryMap.get(category.id);

    if (!current) {
      continue;
    }

    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);

      if (parent) {
        parent.children.push(current);
      }
    } else {
      roots.push(current);
    }
  }

  return roots;
}

/**
 * Get a category by its slug.
 */
export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();

  const { data: category, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching service category:", error);
    return null;
  }

  if (!category) {
    return null;
  }

  let parent: ServiceCategoryParent | null = null;

  if (category.parent_id) {
    const { data: parentCategory, error: parentError } = await supabase
      .from("service_categories")
      .select("id, name, slug")
      .eq("id", category.parent_id)
      .maybeSingle();

    if (parentError) {
      console.error("Error fetching parent service category:", parentError);
    } else {
      parent = parentCategory;
    }
  }

  return {
    ...category,
    parent,
  };
}

/**
 * Get all active children belonging to a category.
 */
export async function getChildCategories(parentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_categories")
    .select("*")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching child categories:", error);
    return [];
  }

  return data as ServiceCategory[];
}
