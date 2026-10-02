"use client";

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
  Dog,
  Droplets,
  Flower2,
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
  type LucideIcon,
} from "lucide-react";

type IconOption = {
  name: string;
  icon: LucideIcon;
};

const ICON_OPTIONS: IconOption[] = [
  { name: "House", icon: House },
  { name: "Car", icon: Car },
  { name: "Truck", icon: Truck },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Shirt", icon: Shirt },
  { name: "Laptop", icon: Laptop },
  { name: "Hammer", icon: Hammer },
  { name: "Flower2", icon: Flower2 },
  { name: "Shield", icon: Shield },
  { name: "Scissors", icon: Scissors },
  { name: "CalendarDays", icon: CalendarDays },
  { name: "HeartHandshake", icon: HeartHandshake },
  { name: "Briefcase", icon: Briefcase },
  { name: "Building2", icon: Building2 },
  { name: "Sparkles", icon: Sparkles },
  { name: "Wrench", icon: Wrench },
  { name: "Zap", icon: Zap },
  { name: "Camera", icon: Camera },
  { name: "Phone", icon: Phone },
  { name: "Tv", icon: Tv },
  { name: "Droplets", icon: Droplets },
  { name: "Paintbrush", icon: Paintbrush },
  { name: "Leaf", icon: Leaf },
  { name: "Baby", icon: Baby },
  { name: "Dog", icon: Dog },
  { name: "PawPrint", icon: PawPrint },
  { name: "MapPin", icon: MapPin },
  { name: "ClipboardList", icon: ClipboardList },
  { name: "Clock3", icon: Clock3 },
  { name: "Star", icon: Star },
  { name: "CheckCircle2", icon: CheckCircle2 },
  { name: "CircleHelp", icon: CircleHelp },
  { name: "MoreHorizontal", icon: MoreHorizontal },
];

type ServiceIconPickerProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ServiceIconPicker({
  value,
  onChange,
  disabled = false,
}: ServiceIconPickerProps) {
  const selectedIcon = value || "Sparkles";

  return (
    <div>
      <input type="hidden" name="icon" value={selectedIcon} />

      <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
          {(() => {
            const option = ICON_OPTIONS.find(
              (item) => item.name === selectedIcon,
            );

            const Icon = option?.icon ?? Sparkles;

            return <Icon className="h-5 w-5 text-slate-700" />;
          })()}
        </div>

        <div>
          <p className="text-xs text-slate-500">Selected icon</p>
          <p className="text-sm font-medium text-slate-900">{selectedIcon}</p>
        </div>
      </div>

      <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-8">
        {ICON_OPTIONS.map(({ name, icon: Icon }) => {
          const selected = selectedIcon === name;

          return (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={`Select ${name} icon`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(name)}
              className={[
                "flex h-11 w-full items-center justify-center rounded-lg border transition",
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50",
                disabled ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
            </button>
          );
        })}
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        Choose an icon that represents this service.
      </p>
    </div>
  );
}
