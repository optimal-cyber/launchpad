"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function isExternal(href: string) {
  try {
    const u = new URL(href, window.location.origin);
    return u.origin !== window.location.origin;
  } catch { return false; }
}

export default function SmartLink(
  { href, children, className, ...props }: { href: string; children: React.ReactNode; className?: string; [key: string]: any }
){
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExternal(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      router.push(href);
    }
  };
  
  return (
    <a 
      href={href} 
      onClick={handleClick} 
      className={className} 
      role="link" 
      aria-label={`Open ${href}`}
      {...props}
    >
      {children}
    </a>
  );
}
