import type { FindMeLink } from "@/lib/types";

function isExternalUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function FindMeSection({ links }: { links: FindMeLink[] }) {
  if (links.length === 0) return null;

  return (
    <section aria-labelledby="find-me-heading" className="text-center">
      <h2
        id="find-me-heading"
        className="font-script text-[1.7rem] italic leading-none text-muted"
      >
        find me at
      </h2>
      <ul className="mt-4 flex flex-wrap items-center justify-center gap-8">
        {links.map((link) => {
          const external = isExternalUrl(link.url);
          return (
            <li key={`${link.label}-${link.url}`}>
              <a
                href={link.url}
                className="group relative inline-block cursor-pointer font-script text-[1.45rem] italic leading-none text-foreground no-underline"
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left scale-x-0 rotate-[-4deg] bg-current transition-transform duration-200 ease-out group-hover:scale-x-100"
                />
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
