import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { HeaderLogo } from "@/src/components/Header/HeaderLogo";

interface AppHeaderProps {
  headerNavbar: string;
}

export const AppHeader = ({ headerNavbar }: AppHeaderProps) => {
  const clean = DOMPurify.sanitize(headerNavbar);

  /*
    Иконка Белорусь:
    <div className="flex items-center gap-1 text-xs hide-on-mobile">
      <Image src={"/ab-market/geo.svg"} alt={"Geo"} width={15} height={15} />
      Беларусь
    </div>
   */
  return (
    <>
      <header className={"sticky top-0 left-0 w-full z-50  border-b  border-gray-200 bg-white"}>
        <div className={"container-2025 flex justify-between items-center"}>
          <div className="flex gap-2 items-center">
            <div className="header__menu-open mr-0!" aria-label="Открыть меню"></div>
            <div className={"app-logo"}>
              <HeaderLogo />
            </div>
          </div>
          <div className={"flex sm:gap-2 sm:items-center sm:flex-row flex-col"}>
            <Link
              className={"hover:text-gray-800! sm:border-r sm:pr-4 border-b-0! border-gray-200 flex flex-col "}
              href="tel:+375296038038"
            >
              <span className={"text-gray-600 font-bold sm:text-sm text-xs"}>+375 29 603-80-38</span>
              <span className={"text-xs leading-none text-gray-600 hide-on-mobile"}>Обратный звонок</span>
            </Link>

            <Link className={"hover:text-gray-800! border-b-0! flex flex-col hide-on-mobile"} href="tel:+375296038038">
              <span className={"text-gray-600 font-bold sm:text-sm text-xs"}>abmarketbel@gmail.com</span>
              <span className={"text-xs leading-none text-gray-600"}>Работаем в будни с 10:00 до 17:00</span>
            </Link>
          </div>
        </div>
      </header>
      {/*<div className={"bg-white border-b  border-gray-200 "}>*/}
      {/*  <div className={"container-2025"}>*/}
      {/*    <p className={"text-xs mb-0!"}>*/}
      {/*      <strong>ООО &#34;АБ Маркет&#34;</strong> , Беларусь <br />{" "}*/}
      {/*    </p>*/}
      {/*    <div className={"flex md:justify-between md:flex-row flex-col  text-xs md:gap-5"}>*/}
      {/*      <p className={"mb-0! flex-1 leading-relaxed"}>*/}
      {/*        <strong>*/}
      {/*          Предлагаем комплексные решения по продаже и укладке (замене) коммерческих ковровых покрытий.*/}
      {/*        </strong>{" "}*/}
      {/*        Официальный дистрибьютор фабрики «Нева Тафт» по коммерческим ковровым покрытиям в РБ.*/}
      {/*      </p>*/}
      {/*      <p className={"mb-0! leading-relaxed"}>*/}
      {/*        <strong> Наши партнеры:</strong> <br />{" "}*/}
      {/*        <Link href="https://nevatuft.ru/" className={"text-inherit! border-b-0! !underline"} target={"_blank"}>*/}
      {/*          Фабрика «Нева Тафт»*/}
      {/*        </Link>{" "}*/}
      {/*        , Россия — крупнейший производитель ковровых покрытий в ЕАЭС, <br />*/}
      {/*        <Link className={"text-inherit!  border-b-0! !underline"} href="https://velvet-pro.ru/" target={"_blank"}>*/}
      {/*          ООО «Велвис Про»*/}
      {/*        </Link>{" "}*/}
      {/*        , Россия — производитель ковров, штор и др. в России*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}
      <div className={"bg-[#f8f9fa] border-b py-2  border-gray-200 hide-on-mobile relative"}>
        <div className={"container-2025 text-xs flex flex-wrap"}>
          <span>
            ООО &#34;АБ Маркет&#34;{" "}
            <strong>является официальным дистрибьютором по коммерческим ковровым покрытиям фабрики </strong>{" "}
            <Link href="https://nevatuft.ru/" className={"text-inherit! border-b-0! !underline"} target={"_blank"}>
              &#34;Нева Тафт&#34;
            </Link>{" "}
            - крупнейшего производителя ковровых покрытий в ЕАЭС,
          </span>
          <span>
            а также <strong>партнером</strong>{" "}
            <Link className={"text-inherit!  border-b-0! !underline"} href="https://velvet-pro.ru/" target={"_blank"}>
              ООО &#34;Вельвет Про&#34;
            </Link>{" "}
            - ведущего производителя ковров и штор под заказ в Российской Федерации.
          </span>
        </div>
      </div>
      <div className={"sticky left-0 top-[65px] z-50 bg-white"} dangerouslySetInnerHTML={{ __html: clean }} />
    </>
  );
};
