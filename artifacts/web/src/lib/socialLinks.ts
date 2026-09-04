export const OFFICIAL_SOCIAL_LINKS = [
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@mapping.with.mela",
    href: "https://www.tiktok.com/@mapping.with.mela",
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@mapping_with_melanin",
    href: "https://www.instagram.com/mapping_with_melanin/",
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "Mapping With Melanin.com",
    href: "https://www.facebook.com/profile.php?id=61591358846366",
  },
  {
    id: "threads",
    label: "Threads",
    handle: "@mapping_with_melanin",
    href: "https://www.threads.com/@mapping_with_melanin",
  },
] as const;

export type SharePlatform = "Threads" | "Facebook" | "LinkedIn";

export function getSocialShareUrl(platform: SharePlatform, text: string, url: string): string {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);

  switch (platform) {
    case "Threads":
      return `https://www.threads.com/intent/post?text=${encodedText}&url=${encodedUrl}`;
    case "Facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "LinkedIn":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  }
}
