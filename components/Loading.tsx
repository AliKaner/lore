export default function Loading({ label = "Yükleniyor…" }: { label?: string }) {
  return <p className="animate-pulse text-sm text-muted">{label}</p>;
}
