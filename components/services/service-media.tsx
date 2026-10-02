import Image from "next/image";

import { ServiceIcon } from "@/components/services/service-icon";

type ServiceMediaProps = {
  icon?: string | null;
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: {
    wrapper: "h-11 w-11",
    image: 44,
    icon: "h-5 w-5",
  },
  md: {
    wrapper: "h-12 w-12",
    image: 48,
    icon: "h-6 w-6",
  },
  lg: {
    wrapper: "h-16 w-16",
    image: 64,
    icon: "h-7 w-7",
  },
};

export function ServiceMedia({
  icon,
  imageUrl,
  name,
  size = "md",
}: ServiceMediaProps) {
  const config = sizes[size];

  return (
    <div
      className={`flex ${config.wrapper} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-700`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={config.image}
          height={config.image}
          className="h-full w-full object-cover"
        />
      ) : (
        <ServiceIcon name={icon} className={config.icon} />
      )}
    </div>
  );
}
