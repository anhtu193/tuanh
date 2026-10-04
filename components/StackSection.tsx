"use client";

import LogoLoop from "@/components/LogoLoop";
import { getSimpleIcon } from "@/lib/stack-icons";
import type { StackItem } from "@/lib/types";
import { useMemo } from "react";

export default function StackSection({ stack }: { stack: StackItem[] }) {
  const logos = useMemo(
    () =>
      stack
        .map((item) => {
          const Icon = getSimpleIcon(item.icon);
          if (!Icon) return null;
          return {
            node: <Icon />,
            title: item.title,
            ariaLabel: item.title,
            href: item.href,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null),
    [stack],
  );

  if (logos.length === 0) return null;

  return (
    <section aria-labelledby="stack-heading" className="text-center">
      <h2
        id="stack-heading"
        className="font-script text-[1.7rem] italic leading-none text-muted"
      >
        stack
      </h2>
      <div className="mx-auto mt-5 w-full max-w-xl px-10 sm:px-16 md:px-20">
        <LogoLoop
          logos={logos}
          speed={80}
          direction="left"
          logoHeight={28}
          gap={40}
          pauseOnHover
          fadeOut
          fadeOutColor="var(--background)"
          scaleOnHover
          ariaLabel="Tech stack"
        />
      </div>
    </section>
  );
}
