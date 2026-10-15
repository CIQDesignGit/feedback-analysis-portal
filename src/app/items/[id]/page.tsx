import { redirect } from "next/navigation";

export default async function Page({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  redirect(`/feedback/${id.replace(/^rv/, "fb")}`);
}
