import { redirect } from "next/navigation";

/** Rut aplikasi: /menu, /simulasi, /kalkulator, /bahan. Root lempar ke menu. */
export default function Home() {
  redirect("/menu");
}
