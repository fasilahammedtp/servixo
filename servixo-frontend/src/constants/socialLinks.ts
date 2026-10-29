export const SOCIAL_LINKS = {
  INSTAGRAM: "https://www.instagram.com/fa.siiiiil/",
  LINKEDIN: "https://www.linkedin.com/in/fasil-ahammed-tp-1b7330378/",
} as const;

export type SocialPlatform = keyof typeof SOCIAL_LINKS;

export const INSTAGRAM_URL = SOCIAL_LINKS.INSTAGRAM;
export const LINKEDIN_URL = SOCIAL_LINKS.LINKEDIN;

export interface SocialLinkItem {
  id: "instagram" | "linkedin";
  label: string;
  url: string;
}

export const SOCIAL_LINK_ITEMS: readonly SocialLinkItem[] = [
  {
    id: "instagram",
    label: "Instagram",
    url: SOCIAL_LINKS.INSTAGRAM,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: SOCIAL_LINKS.LINKEDIN,
  },
] as const;
