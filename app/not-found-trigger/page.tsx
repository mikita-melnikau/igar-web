import { notFound } from "next/navigation";

// из прокси нельзя никак вызвать нашу 404 старницу, поэтому нужно делать отдельную страницу чтобы тригерить 404
export default function Page() {
  notFound();
}
