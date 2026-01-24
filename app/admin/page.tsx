import { redirect } from "next/navigation";

export default function Admin() {
  // Always land on the Decap entry file
  redirect("/admin/index.html");
}
