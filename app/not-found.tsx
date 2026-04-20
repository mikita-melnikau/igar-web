import Link from "next/link";

const AppNotFound = () => {
  return (
    <section className="bg-gray-100 py-10 flex flex-col gap-1 items-center justify-center min-h-screen">
      <h4>Страница не найдена</h4>
      <Link href="/" title="На главную">
        Вернуться на главную.
      </Link>
    </section>
  );
};

export default AppNotFound;
