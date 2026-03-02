import Link from "next/link";

const AppNotFound = () => {
  return (
    <section className={"bg-[#f0f3f4] py-10 flex flex-col gap-1 items-center justify-center h-[100vh]"}>
      <h4>Неправильно набран адрес, или такой страницы больше не существует.</h4>
      <Link href="/" className={"underline text-red-400"}>
        Вернуться на главную.
      </Link>
    </section>
  );
};

export default AppNotFound;
