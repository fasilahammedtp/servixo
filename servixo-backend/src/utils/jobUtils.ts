export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getJobCategoryDisplay(
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

export function isSkillMatchForOther(workerSkills: string[] = [], customTitle?: string): boolean {
  if (!customTitle || !workerSkills || workerSkills.length === 0) return false;

  // General skill check (e.g. "Handyman")
  const hasGeneralSkill = workerSkills.some((skill) =>
    skill.trim().toLowerCase() === "handyman"
  );
  if (hasGeneralSkill) return true;

  const normalizedTitle = customTitle.toLowerCase();

  // Extract keywords of at least 4 letters from customTitle
  const titleKeywords = (customTitle.match(/[a-zA-Z0-9]+/g) || [])
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 4);

  for (const skill of workerSkills) {
    const trimmedSkill = skill.trim();
    if (!trimmedSkill) continue;
    const lowerSkill = trimmedSkill.toLowerCase();

    // A skill matches if the title contains the skill
    if (normalizedTitle.includes(lowerSkill)) {
      return true;
    }

    // A skill matches if it contains a keyword of at least 4 letters from the title
    for (const kw of titleKeywords) {
      if (lowerSkill.includes(kw)) {
        return true;
      }
    }
  }

  return false;
}
