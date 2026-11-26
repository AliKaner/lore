import { redirect } from "next/navigation";

// Characters and places now live in the writer's universe with everything else.
export default function Page() {
  redirect("/evren?tur=mekan");
}
