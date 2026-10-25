import React from "react";
import {
  Briefcase,
  Droplets,
  Zap,
  Home as HomeIcon,
  Paintbrush,
  Wrench,
  Sparkles,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { getTransformedImageUrl } from "./imageUtils";

/**
 * Returns the matching Lucide icon for a given category name or stored icon key.
 */
export function getCategoryIcon(nameOrIcon: string, className = "w-6 h-6"): React.ReactElement {
  const normalized = (nameOrIcon || "").toLowerCase();

  if (normalized.includes("plumb") || normalized.includes("drop")) return <Droplets className={className} />;
  if (normalized.includes("elect") || normalized.includes("zap") || normalized.includes("bolt")) return <Zap className={className} />;
  if (normalized.includes("clean") || normalized.includes("home")) return <HomeIcon className={className} />;
  if (normalized.includes("paint")) return <Paintbrush className={className} />;
  if (normalized.includes("carpent") || normalized.includes("hammer")) return <Wrench className={className} />;
  if (normalized.includes("ac") || normalized.includes("repair") || normalized.includes("wrench")) return <Wrench className={className} />;
  if (normalized.includes("sparkle") || normalized.includes("beauty")) return <Sparkles className={className} />;
  if (normalized.includes("shield") || normalized.includes("security")) return <Shield className={className} />;
  if (normalized.includes("other") || normalized.includes("more")) return <MoreHorizontal className={className} />;

  return <Briefcase className={className} />;
}

/**
 * Fallback image mapping keyed by category name.
 */
export function getCategoryFallbackImage(name: string): string {
  const normalized = (name || "").toLowerCase();

  if (normalized.includes("other")) return "";
  if (normalized.includes("plumb")) return "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=800&auto=format&fit=crop";
  if (normalized.includes("electri")) return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&auto=format&fit=crop";
  if (normalized.includes("clean")) return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop";
  if (normalized.includes("paint")) return "https://images.unsplash.com/photo-1734475318787-b2b737296469?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHBhaW50ZXJ8ZW58MHx8MHx8fDA%3D";
  if (normalized.includes("ac")) return "https://plus.unsplash.com/premium_photo-1683134512538-7b390d0adc9e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YWMlMjByZXBhaXJ8ZW58MHx8MHx8fDA%3D";
  if (normalized.includes("appliance")) return "https://plus.unsplash.com/premium_photo-1661342406124-740ae7a0dd0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBwbGlhbmNlJTIwcmVwYWlyfGVufDB8fDB8fHww";
  if (normalized.includes("carpent")) return "https://images.unsplash.com/photo-1544164560-adac3045edb2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y2FycGVudGVyfGVufDB8fDB8fHww";
  if (normalized.includes("repair")) return "https://plus.unsplash.com/premium_photo-1661342406124-740ae7a0dd0e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBwbGlhbmNlJTIwcmVwYWlyfGVufDB8fDB8fHww";

  return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800&auto=format&fit=crop";
}

/**
 * Resolves a category's display image:
 * - If category.image is set in DB, returns transformed Cloudinary URL with isDefault: false.
 * - Otherwise returns the shared fallback mapping with isDefault: true.
 */
export function resolveCategoryPhoto(
  category: { name: string; image?: string },
  width = 800
): { imageUrl: string; isDefault: boolean } {
  if (category.image && category.image.trim()) {
    return {
      imageUrl: getTransformedImageUrl(category.image, width),
      isDefault: false,
    };
  }

  const fallback = getCategoryFallbackImage(category.name);
  return {
    imageUrl: fallback,
    isDefault: true,
  };
}
