import { useT } from "@/lib/i18n";
export default function Loading({ label }: { label?: string }) {
  const t = useT();
  label ??= t("Yükleniyor…");
  return <p className="animate-pulse text-sm text-muted">{label}</p>;
}
