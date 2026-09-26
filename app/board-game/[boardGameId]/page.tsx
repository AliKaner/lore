import BoardGameClient from "./BoardGameClient";
export default function Page({ params }: { params: Promise<{ boardGameId: string }> }) { return <BoardGameClient params={params}/>; }
