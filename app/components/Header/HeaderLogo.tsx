"use client";
import Link from "next/link";
import Image from "next/image";
import { useIsMobile } from "@/app/hooks/useIsMobile";

export const HeaderLogo = () => {
  const { isMobile } = useIsMobile();

  const logo = <Image src={"/logo.jpg"} alt={"logo"} width={162} height={70} />;

  return isMobile ? (
    logo
  ) : (
    <Link href={"/"} className={"border-b-0!"}>
      {logo}
    </Link>
  );
};
