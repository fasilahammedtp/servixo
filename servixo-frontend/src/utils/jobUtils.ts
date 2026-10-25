export function formatJobCategory(
  jobOrCategory?: { category?: any; customTitle?: string } | string | null,
  customTitle?: string
): string {
  if (!jobOrCategory) return "Service";
  let catName = "";
  let title = customTitle;

  if (typeof jobOrCategory === "object") {
    catName =
      typeof jobOrCategory.category === "object" && jobOrCategory.category?.name
        ? jobOrCategory.category.name
        : typeof jobOrCategory.category === "string"
          ? jobOrCategory.category
          : "";
    if (!title && jobOrCategory.customTitle) {
      title = jobOrCategory.customTitle;
    }
  } else if (typeof jobOrCategory === "string") {
    catName = jobOrCategory;
  }

  if (catName.trim().toLowerCase() === "other" && title) {
    return `Other: ${title.trim()}`;
  }
  return catName || title || "Service";
}
