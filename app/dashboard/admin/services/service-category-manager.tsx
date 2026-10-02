"use client";

import { useMemo, useState } from "react";

import {
  Baby,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Dog,
  Droplets,
  Edit3,
  Flower2,
  FolderTree,
  Hammer,
  HeartHandshake,
  House,
  Laptop,
  Leaf,
  MapPin,
  MoreHorizontal,
  Paintbrush,
  PawPrint,
  Phone,
  Plus,
  Scissors,
  Search,
  Shield,
  Shirt,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  Truck,
  Tv,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { deleteServiceCategory, toggleServiceCategory } from "./actions";

import { deleteService, toggleService } from "./service-actions";

import { ServiceCategoryForm } from "./service-category-form";
import { ServiceForm } from "./service-form";

/* =========================================================
   TYPES
========================================================= */

type Category = {
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

type Service = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  requires_verification: boolean;
  requires_certificate: boolean;
  created_at: string;
  updated_at: string;
};

type ServiceCategoryManagerProps = {
  categories: Category[];
  services: Service[];
};

/* =========================================================
   ICON MAP
========================================================= */

const ICON_MAP: Record<string, LucideIcon> = {
  Baby,
  Briefcase,
  Building2,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Clock3,
  Dog,
  Droplets,
  Flower2,
  FolderTree,
  Hammer,
  HeartHandshake,
  House,
  Laptop,
  Leaf,
  MapPin,
  MoreHorizontal,
  Paintbrush,
  PawPrint,
  Phone,
  Scissors,
  Shield,
  Shirt,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Tv,
  Wrench,
  Zap,
};

/* =========================================================
   HELPERS
========================================================= */

function getIcon(iconName: string | null, fallback: LucideIcon) {
  if (!iconName) {
    return fallback;
  }

  return ICON_MAP[iconName] ?? fallback;
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* =========================================================
   MAIN MANAGER
========================================================= */

export function ServiceCategoryManager({
  categories,
  services,
}: ServiceCategoryManagerProps) {
  const [search, setSearch] = useState("");

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [categoryFormOpen, setCategoryFormOpen] = useState(false);

  const [serviceFormOpen, setServiceFormOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [editingService, setEditingService] = useState<Service | null>(null);

  // Parent category used when creating/editing a subcategory.
  const [categoryParent, setCategoryParent] = useState<Category | null>(null);

  // Subcategory used when creating/editing a service.
  const [serviceSubcategory, setServiceSubcategory] = useState<Category | null>(
    null,
  );

  /* =======================================================
     LOOKUPS
  ======================================================= */

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, Service[]>();

    for (const service of services) {
      const current = map.get(service.category_id) ?? [];

      current.push(service);
      map.set(service.category_id, current);
    }

    for (const serviceList of map.values()) {
      serviceList.sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
      );
    }

    return map;
  }, [services]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Category[]>();

    for (const category of categories) {
      if (!category.parent_id) {
        continue;
      }

      const children = map.get(category.parent_id) ?? [];

      children.push(category);
      map.set(category.parent_id, children);
    }

    for (const children of map.values()) {
      children.sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
      );
    }

    return map;
  }, [categories]);

  /* =======================================================
     SEARCH
  ======================================================= */

  const matchingIds = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return null;
    }

    const categoryIds = new Set<string>();

    for (const category of categories) {
      const categoryMatches =
        category.name.toLowerCase().includes(value) ||
        category.slug.toLowerCase().includes(value) ||
        category.description?.toLowerCase().includes(value);

      if (categoryMatches) {
        categoryIds.add(category.id);

        if (category.parent_id) {
          categoryIds.add(category.parent_id);
        }
      }
    }

    for (const service of services) {
      const subcategory = categoryById.get(service.category_id);

      const parent = subcategory?.parent_id
        ? categoryById.get(subcategory.parent_id)
        : null;

      const serviceMatches =
        service.name.toLowerCase().includes(value) ||
        service.slug.toLowerCase().includes(value) ||
        service.description?.toLowerCase().includes(value);

      const subcategoryMatches = subcategory?.name
        .toLowerCase()
        .includes(value);

      const parentMatches = parent?.name.toLowerCase().includes(value);

      if (serviceMatches || subcategoryMatches || parentMatches) {
        if (subcategory) {
          categoryIds.add(subcategory.id);
        }

        if (parent) {
          categoryIds.add(parent.id);
        }
      }
    }

    return categoryIds;
  }, [search, categories, services, categoryById]);

  const rootCategories = useMemo(() => {
    return categories
      .filter((category) => {
        if (category.parent_id !== null) {
          return false;
        }

        if (!matchingIds) {
          return true;
        }

        return matchingIds.has(category.id);
      })
      .sort(
        (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
      );
  }, [categories, matchingIds]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalCategories = categories.filter(
    (category) => category.parent_id === null,
  ).length;

  const totalSubcategories = categories.filter(
    (category) => category.parent_id !== null,
  ).length;

  const activeServices = services.filter((service) => service.is_active).length;

  /* =======================================================
     HELPERS
  ======================================================= */

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  /* =======================================================
     CATEGORY FORM
  ======================================================= */

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryParent(null);
    setCategoryFormOpen(true);
  }

  function openCreateSubcategory(parent: Category) {
    setEditingCategory(null);
    setCategoryParent(parent);
    setCategoryFormOpen(true);

    setExpanded((current) => {
      const next = new Set(current);
      next.add(parent.id);
      return next;
    });
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);

    if (category.parent_id) {
      const parent = categoryById.get(category.parent_id) ?? null;

      setCategoryParent(parent);
    } else {
      setCategoryParent(null);
    }

    setCategoryFormOpen(true);
  }

  /* =======================================================
     SERVICE FORM
  ======================================================= */

  function openCreateService(subcategory?: Category) {
    setEditingService(null);
    setServiceSubcategory(subcategory ?? null);
    setServiceFormOpen(true);

    if (subcategory) {
      setExpanded((current) => {
        const next = new Set(current);
        next.add(subcategory.id);
        return next;
      });
    }
  }

  function openEditService(service: Service) {
    setEditingService(service);

    const subcategory = categoryById.get(service.category_id) ?? null;

    setServiceSubcategory(subcategory);
    setServiceFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Admin
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Service Management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Manage categories, subcategories, and services from one hierarchy.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openCreateCategory}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>

          <button
            type="button"
            onClick={() => openCreateService()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add service
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Categories"
          value={totalCategories}
          icon={<FolderTree className="h-5 w-5" />}
        />

        <SummaryCard
          label="Subcategories"
          value={totalSubcategories}
          icon={<FolderTree className="h-5 w-5" />}
        />

        <SummaryCard
          label="Active services"
          value={activeServices}
          icon={<Wrench className="h-5 w-5" />}
        />
      </div>

      {/* Unified hierarchy */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Service hierarchy
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Category → Subcategory → Service
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories or services..."
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Tree */}
        <div className="divide-y divide-slate-200">
          {rootCategories.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <FolderTree className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No results found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try a different search.
              </p>
            </div>
          ) : (
            rootCategories.map((category) => (
              <CategoryTreeRow
                key={category.id}
                category={category}
                children={childrenByParent.get(category.id) ?? []}
                servicesByCategory={servicesByCategory}
                categoryById={categoryById}
                matchingIds={matchingIds}
                expanded={expanded}
                onToggle={toggleExpanded}
                onEditCategory={openEditCategory}
                onAddSubcategory={openCreateSubcategory}
                onEditService={openEditService}
                onAddService={openCreateService}
              />
            ))
          )}
        </div>
      </section>

      {/* Category form */}
      {categoryFormOpen && (
        <ServiceCategoryForm
          categories={categories}
          category={editingCategory}
          parentCategory={categoryParent}
          onClose={() => {
            setCategoryFormOpen(false);
            setEditingCategory(null);
            setCategoryParent(null);
          }}
        />
      )}

      {/* Service form */}
      {serviceFormOpen && (
        <ServiceForm
          categories={categories}
          service={editingService}
          subcategory={serviceSubcategory}
          onClose={() => {
            setServiceFormOpen(false);
            setEditingService(null);
            setServiceSubcategory(null);
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

/* =========================================================
   CATEGORY TREE ROW
========================================================= */

function CategoryTreeRow({
  category,
  children,
  servicesByCategory,
  categoryById,
  matchingIds,
  expanded,
  onToggle,
  onEditCategory,
  onAddSubcategory,
  onEditService,
  onAddService,
}: {
  category: Category;
  children: Category[];
  servicesByCategory: Map<string, Service[]>;
  categoryById: Map<string, Category>;
  matchingIds: Set<string> | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEditCategory: (category: Category) => void;
  onAddSubcategory: (category: Category) => void;
  onEditService: (service: Service) => void;
  onAddService: (subcategory?: Category) => void;
}) {
  const hasChildren = children.length > 0;

  const isExpanded = expanded.has(category.id) || Boolean(matchingIds);

  async function handleToggle() {
    const formData = new FormData();

    formData.set("id", category.id);

    await toggleServiceCategory(formData);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This may fail if the category still has subcategories.`,
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData();

    formData.set("id", category.id);

    await deleteServiceCategory(formData);
  }

  const CategoryIcon = getIcon(category.icon, FolderTree);

  return (
    <div>
      {/* Top-level category */}
      <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(category.id)}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label={
                isExpanded
                  ? `Collapse ${category.name}`
                  : `Expand ${category.name}`
              }
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          ) : (
            <div className="h-8 w-8 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <CategoryIcon className="h-5 w-5" />
                </div>
              )}

              <h3 className="font-semibold text-slate-900">{category.name}</h3>

              <StatusBadge active={category.is_active} />

              {hasChildren && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  {children.length}{" "}
                  {children.length === 1 ? "subcategory" : "subcategories"}
                </span>
              )}
            </div>

            {category.description && (
              <p className="mt-2 text-sm text-slate-500">
                {category.description}
              </p>
            )}

            <p className="mt-1 truncate text-xs text-slate-400">
              /services/{category.slug}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {/* ADD SUBCATEGORY */}
            <button
              type="button"
              onClick={() => onAddSubcategory(category)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title={`Add subcategory under ${category.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add subcategory
            </button>

            <button
              type="button"
              onClick={() => onEditCategory(category)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              title="Edit category"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleToggle}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {category.is_active ? "Deactivate" : "Activate"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 hover:text-red-700"
              title="Delete category"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {isExpanded && hasChildren && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          {children.map((subcategory) => (
            <SubcategoryTreeRow
              key={subcategory.id}
              category={subcategory}
              parent={category}
              services={servicesByCategory.get(subcategory.id) ?? []}
              categoryById={categoryById}
              matchingIds={matchingIds}
              expanded={expanded}
              onToggle={onToggle}
              onEditCategory={onEditCategory}
              onEditService={onEditService}
              onAddService={onAddService}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUBCATEGORY TREE ROW
========================================================= */

function SubcategoryTreeRow({
  category,
  parent,
  services,
  categoryById,
  matchingIds,
  expanded,
  onToggle,
  onEditCategory,
  onEditService,
  onAddService,
}: {
  category: Category;
  parent: Category;
  services: Service[];
  categoryById: Map<string, Category>;
  matchingIds: Set<string> | null;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEditCategory: (category: Category) => void;
  onEditService: (service: Service) => void;
  onAddService: (subcategory?: Category) => void;
}) {
  const hasServices = services.length > 0;

  const isExpanded = expanded.has(category.id) || Boolean(matchingIds);

  async function handleToggle() {
    const formData = new FormData();

    formData.set("id", category.id);

    await toggleServiceCategory(formData);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This may fail if services still belong to this subcategory.`,
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData();

    formData.set("id", category.id);

    await deleteServiceCategory(formData);
  }

  const CategoryIcon = getIcon(category.icon, FolderTree);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:px-6 sm:pl-20">
        <div className="flex items-start gap-3">
          {hasServices ? (
            <button
              type="button"
              onClick={() => onToggle(category.id)}
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
              aria-label={
                isExpanded
                  ? `Collapse ${category.name}`
                  : `Expand ${category.name}`
              }
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          ) : (
            <div className="h-8 w-8 shrink-0" />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {category.image_url ? (
                <img
                  src={category.image_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200">
                  <CategoryIcon className="h-4 w-4" />
                </div>
              )}

              <h4 className="font-medium text-slate-800">{category.name}</h4>

              <StatusBadge active={category.is_active} />

              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                Subcategory
              </span>

              {hasServices && (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                  {services.length}{" "}
                  {services.length === 1 ? "service" : "services"}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-400">
              {parent.name} → {category.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-400">
              /services/{parent.slug}/{category.slug}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {/* ADD SERVICE */}
            <button
              type="button"
              onClick={() => onAddService(category)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title={`Add service under ${category.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
              Add service
            </button>

            <button
              type="button"
              onClick={() => onEditCategory(category)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              title="Edit subcategory"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleToggle}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {category.is_active ? "Deactivate" : "Activate"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 transition hover:bg-red-50 hover:text-red-700"
              title="Delete subcategory"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Services */}
      {isExpanded && hasServices && (
        <div className="border-b border-slate-100 bg-white">
          {services.map((service) => (
            <ServiceTreeRow
              key={service.id}
              service={service}
              parent={parent}
              subcategory={category}
              onEdit={() => onEditService(service)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SERVICE TREE ROW
========================================================= */

function ServiceTreeRow({
  service,
  parent,
  subcategory,
  onEdit,
}: {
  service: Service;
  parent: Category;
  subcategory: Category;
  onEdit: () => void;
}) {
  async function handleToggle() {
    const formData = new FormData();

    formData.set("id", service.id);

    await toggleService(formData);
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${service.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    const formData = new FormData();

    formData.set("id", service.id);

    await deleteService(formData);
  }

  const ServiceIcon = getIcon(service.icon, Wrench);

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:pl-32 sm:pr-6">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt=""
            className="mt-0.5 h-8 w-8 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <ServiceIcon className="h-4 w-4" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-medium text-slate-900">{service.name}</h5>

            <StatusBadge active={service.is_active} />

            {service.requires_verification && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Verification required
              </span>
            )}

            {service.requires_certificate && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                Certificate required
              </span>
            )}
          </div>

          {service.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {service.description}
            </p>
          )}

          <p className="mt-1 truncate text-xs text-slate-400">
            /services/{parent.slug}/{subcategory.slug}/{service.slug}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
          title="Edit service"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleToggle}
          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          {service.is_active ? "Deactivate" : "Activate"}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50 hover:text-red-700"
          title="Delete service"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
