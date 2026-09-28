export default function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col gap-10 pb-4 pt-16">
      <p className="font-script text-[1.65rem] italic leading-none text-muted">
        more coming soon...
      </p>
      <p className="font-script text-muted">
        <span className="mr-1.5 text-lg italic">made by</span>
        <a
          href="/"
          className="group relative inline-block cursor-pointer text-[2rem] leading-none text-foreground/80 no-underline"
        >
          tuanh
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left scale-x-0 rotate-[-4deg] bg-current transition-transform duration-200 ease-out group-hover:scale-x-100"
          />
        </a>
      </p>
    </footer>
  );
}
