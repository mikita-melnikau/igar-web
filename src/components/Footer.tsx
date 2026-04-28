import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { PublicCmsData } from "@/src/types";

interface AppFooterProps {
  cms?: PublicCmsData;
}

const FOOTER_LINKS = [
  { text: "Ковролин", href: "/" },
  { text: "Грязезащитные решётки", href: "/reshetki/" },
  { text: "Контакты", href: "/contacts/" },
];

export const AppFooter = ({ cms }: AppFooterProps) => {
  const FOOTER_CONTACTS = useMemo(
    () => [
      { icon: "/ab-market/map-pin.svg", text: cms?.contact.address },
      {
        icon: "/ab-market/phone.svg",
        text: cms?.contact.phone,
        href: cms?.contact.phone ? `tel:${cms.contact.phone}` : undefined,
      },
      {
        icon: "/ab-market/mail.svg",
        text: cms?.contact.email,
        href: cms?.contact.email ? `mailto:${cms.contact.email}` : undefined,
      },
      {
        icon: "/ab-market/clock.svg",
        text: "Пн–Пт: 10:00 – 17:00",
      },
    ],
    [cms?.contact.address, cms?.contact.email, cms?.contact.phone],
  );

  return (
    <footer className={"bg-footer-color text-white"}>
      <div className={"container-2025"}>
        <div className={"grid gap-10 md:grid-cols-12 py-10"}>
          <div className={"md:!ml-[var(--logo-left-offset)] ml-0 md:col-span-5 flex flex-col gap-4"}>
            <div className="relative w-fit leading-[0] overflow-hidden group">
              <div className="pointer-events-none absolute inset-0 z-10 footer-logo-shadow" />
              <Image src="/ab-market/logo.jpg" alt="logo" width={162} height={70} preload className="block h-auto" />
            </div>
            <p className={"text-footer-muted-color mb-0! max-w-xs text-sm leading-relaxed"}>
              Поставки по всей Беларуси, помощь с подбором и расчётом под объект.
            </p>
            {cms && (
              <div className={"flex gap-2"}>
                <Link
                  className={
                    "border-b-0! h-11 w-11 rounded-full border border-footer-muted-color p-1 flex justify-center items-center"
                  }
                  href={`https://t.me/${cms.contact.phone}`}
                  target={"_blank"}
                >
                  <Image src="/ab-market/telegram.svg" alt="telegram" width={25} height={25} />
                </Link>
                <Link
                  className={
                    "border-b-0! h-11 w-11 rounded-full border border-footer-muted-color p-1 flex justify-center items-center"
                  }
                  href={`https://wa.me/${cms.contact.phone}`}
                  target={"_blank"}
                >
                  <Image src="/ab-market/whatsapp.svg" alt="whatsapp" width={25} height={25} />
                </Link>
              </div>
            )}
          </div>
          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest">Разделы</h4>
            <div className="mt-5 space-y-3 text-sm !list-none">
              {FOOTER_LINKS.map((link) => (
                <div key={`footer-${link.href}`}>
                  <Link href={link.href} className="inline-flex items-center gap-2 border-b-0! text-white!">
                    <span className="h-px w-4 bg-footer-muted-color" />
                    {link.text}
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-primary-glow">Контакты</h4>
            <div className="mt-5 space-y-4 text-sm">
              {FOOTER_CONTACTS.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Image
                    width={16}
                    height={16}
                    src={item.icon}
                    alt="contact"
                    className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow"
                  />

                  {item.href ? (
                    <Link href={item.href} className="border-b-0! text-white!">
                      {item.text}
                    </Link>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-500 flex md:flex-row flex-col justify-between gap-3 py-5 text-xs text-footer-muted-color">
          <p className={"mb-0!"}>© {new Date().getFullYear()} ABmarket. Все права защищены.</p>
          <p className={"mb-0!"}>Республика Беларусь</p>
        </div>
      </div>
    </footer>
  );
};
