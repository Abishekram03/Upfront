import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/logo/upfront-logo-black.svg"
        alt="UpFront Logo"
        width={120}
        height={32}
        className={cn("h-7 w-auto object-contain dark:hidden", className)}
        priority
      />
      <Image
        src="/logo/upfront-logo-white.svg"
        alt="UpFront Logo"
        width={120}
        height={32}
        className={cn("hidden h-7 w-auto object-contain dark:block", className)}
        priority
      />
    </>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="UpFront home"
      className={cn("flex items-center rounded-md select-none", className)}
    >
      <Image
        src="/logo/upfront-logo-black.svg"
        alt="UpFront Logo"
        width={130}
        height={35}
        className={cn("h-7 sm:h-8 w-auto object-contain dark:hidden", className)}
        priority
      />
      <Image
        src="/logo/upfront-logo-white.svg"
        alt="UpFront Logo"
        width={130}
        height={35}
        className={cn("hidden h-7 sm:h-8 w-auto object-contain dark:block", className)}
        priority
      />
    </Link>
  );
}
