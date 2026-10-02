import {
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
  Droplets,
  Flower2,
  Hammer,
  HeartHandshake,
  House,
  Laptop,
  Leaf,
  MoreHorizontal,
  Paintbrush,
  PawPrint,
  Phone,
  Refrigerator,
  Scissors,
  Shirt,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Tv,
  Wrench,
  Zap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
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
  Droplets,
  Flower2,
  Hammer,
  HeartHandshake,
  House,
  Laptop,
  Leaf,
  MoreHorizontal,
  Paintbrush,
  PawPrint,
  Phone,
  Refrigerator,
  Scissors,
  Shirt,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Tv,
  Wrench,
  Zap,
};

type ServiceIconProps = {
  name?: string | null;
  className?: string;
};

export function ServiceIcon({ name, className = "h-5 w-5" }: ServiceIconProps) {
  const Icon = name ? ICONS[name] : null;

  if (!Icon) {
    return <Briefcase className={className} />;
  }

  return <Icon className={className} />;
}
