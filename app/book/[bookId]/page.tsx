import BookClient from "./BookClient";
export default function Page({ params }: { params: Promise<{ bookId: string }> }) { return <BookClient params={params}/>; }
