"use client";

import Link from "next/link";
import Image from "next/image";
import { useIsMobile } from "@/src/hooks/useIsMobile";

export const HeaderLogo = () => {
  const { isMobile } = useIsMobile();

  const logo = <Image src={"/ab-market/logo.jpg"} alt={"logo"} width={162} height={70} />;

  return isMobile ? (
    logo
  ) : (
    <Link href={"/"} className={"border-b-0!"}>
      {logo}
    </Link>
  );
};
