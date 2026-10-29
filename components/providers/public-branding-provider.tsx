"use client";

import { createContext, useContext } from "react";

export type PublicBranding = {
  platformName: string;
  platformDescription: string;
  platformLogoUrl: string | null;
};

const PublicBrandingContext = createContext<PublicBranding>({
  platformName: "Emirate ErrandHub",
  platformDescription: "Services made easier.",
  platformLogoUrl: null,
});

export function PublicBrandingProvider({
  children,
  branding,
}: {
  children: React.ReactNode;
  branding: PublicBranding;
}) {
  return (
    <PublicBrandingContext.Provider value={branding}>
      {children}
    </PublicBrandingContext.Provider>
  );
}

export function usePublicBranding() {
  return useContext(PublicBrandingContext);
}
