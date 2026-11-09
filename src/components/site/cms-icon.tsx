import * as LucideIcons from "lucide-react";
import { ShieldCheck, type LucideProps } from "lucide-react";

/**
 * Renders a Lucide icon chosen by name from the CMS (e.g. an admin types "ShieldCheck"
 * into a section's "Icon" field). Falls back to a sensible default when the name is
 * empty or isn't a real Lucide icon, so a typo in the admin panel never breaks a page.
 */
export function CmsIcon({
  name,
  fallback = ShieldCheck,
  ...props
}: { name?: string; fallback?: React.ComponentType<LucideProps> } & LucideProps) {
  const icons = LucideIcons as unknown as Record<
    string,
    React.ComponentType<LucideProps> | undefined
  >;
  const trimmed = name?.trim();
  const Icon = (trimmed && icons[trimmed]) || fallback;
  return <Icon {...props} />;
}
