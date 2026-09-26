import UniverseClient from "./UniverseClient";
export default function Page({ params }: { params: Promise<{ universeId: string }> }) { return <UniverseClient params={params}/>; }
