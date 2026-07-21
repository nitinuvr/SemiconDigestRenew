"use client";

import Image from "next/image";
import { useState } from "react";

type ArticleImageProps = {
  src: string | null;
  alt: string;
  sourceName: string;
  featured?: boolean;
};

export function ArticleImage({
  src,
  alt,
  sourceName,
  featured,
}: ArticleImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
        {sourceName}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={featured ? "(min-width: 1024px) 60vw, 100vw" : "280px"}
      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      onError={() => setFailed(true)}
    />
  );
}
