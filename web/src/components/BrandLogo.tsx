import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  priority?: boolean;
  size?: "sm" | "md";
};

export function BrandLogo({ href = "/", priority = false, size = "md" }: Props) {
  const emblem = size === "sm" ? 36 : 44;
  const content = (
    <span className="brand-logo">
      <Image
        src="/assets/sophima-emblem.png"
        alt=""
        width={emblem}
        height={emblem}
        priority={priority}
        className="brand-emblem"
      />
      <span className="brand-wordmark" aria-label="SOPHIMA AI">
        <span className="brand-name">SOPHIMA</span>
        <span className="brand-ai"> AI</span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="brand-logo-link">
      {content}
    </Link>
  );
}
