import ChapterClient from "./ChapterClient";
export default function Page({ params }: { params: Promise<{ bookId: string; chapterId: string }> }) { return <ChapterClient params={params}/>; }
