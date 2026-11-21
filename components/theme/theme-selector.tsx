"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type Theme } from "@/components/theme/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions: {
  value: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Use the light appearance",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Use the dark appearance",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device settings",
    icon: Monitor,
  },
];

type ThemeSelectorProps = {
  showLabel?: boolean;
};

export function ThemeSelector({ showLabel = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const selectedTheme =
    themeOptions.find((option) => option.value === theme) ?? themeOptions[2];

  const SelectedIcon = selectedTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          showLabel ? (
            <button
              type="button"
              aria-label={`Change appearance. Current theme: ${selectedTheme.label}`}
              className="flex w-full items-center gap-3 rounded-lg px-3 -mx-2.5 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <SelectedIcon className="size-4 shrink-0 text-muted-foreground" />

              <span className="flex-1 text-left">Appearance</span>

              <span className="text-xs capitalize text-muted-foreground">
                {selectedTheme.label}
              </span>

              <span className="sr-only">Open theme options</span>
            </button>
          ) : (
            <button
              type="button"
              aria-label={`Change theme. Current theme: ${selectedTheme.label}`}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <SelectedIcon className="size-4" />
            </button>
          )
        }
      />

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
                className="flex cursor-pointer items-center gap-3 py-2.5"
              >
                <Icon className="size-4 shrink-0 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {isSelected && <Check className="size-4 text-emerald-600" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
