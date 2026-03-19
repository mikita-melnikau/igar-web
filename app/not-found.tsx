import Link from "next/link";

const AppNotFound = () => {
  return (
    <section className={"bg-gray-100 py-10 flex flex-col gap-1 items-center justify-center min-h-screen"}>
      <h4>Неправильно набран адрес, или такой страницы больше не существует.</h4>
      <Link href="/" className={"underline text-red-400"}>
        Вернуться на главную.
      </Link>
    </section>
  );
};

export default AppNotFound;
