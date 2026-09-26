import LoreDetailClient from "./LoreDetailClient";
export default function Page({ params }: { params: Promise<{ id: string }> }) { return <LoreDetailClient params={params}/>; }
