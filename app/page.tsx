import FadeIn from "@/components/FadeIn";
import FindMeSection from "@/components/FindMeSection";
import FoldText from "@/components/FoldText";
import HologramPeek from "@/components/HologramPeek";
import ProjectsCarousel from "@/components/projects/ProjectsCarousel";
import SiteFooter from "@/components/SiteFooter";
import SplitText from "@/components/SplitText";
import StackSection from "@/components/StackSection";
import { getSiteProfile } from "@/lib/profile";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const [projects, profile] = await Promise.all([
    listProjects({ visibleOnly: true }),
    getSiteProfile(),
  ]);
  const hasProjects = projects.length > 0;
  const hasStack = profile.stack.length > 0;
  const hasLinks = profile.links.length > 0;
  const introLines = hasProjects
    ? [
        "A small place for things I build.",
        "Experiments, tools, and side projects.",
      ]
    : ["A small place for things I build. Projects will live here soon."];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-16 sm:px-6 md:px-8">
      <HologramPeek />
      <main className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-md max-md:pr-44">
          <h1 className="text-3xl font-semibold tracking-tight">
            <FoldText
              text="tuanh"
              fontSize={30}
              fontWeight={600}
              color="inherit"
              splitBy="char"
              hinge="top"
              trigger="mount"
            />
          </h1>
          <div className="mt-4 text-lg leading-8 text-foreground/70">
            {introLines.map((line, index) => (
              <SplitText
                key={line}
                text={line}
                tag="p"
                textAlign="left"
                splitType="chars"
                delay={40}
                startDelay={index * 0.2}
                duration={0.9}
                ease="power3.out"
                from={{ opacity: 0, y: 28 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-40px"
              />
            ))}
          </div>
        </div>
        {hasProjects ? (
          <FadeIn className="mt-6" delay={0.08}>
            <section aria-labelledby="projects-heading">
              <h2
                id="projects-heading"
                className="mx-auto w-full max-w-md font-script text-[1.7rem] italic leading-none text-muted"
              >
                projects
              </h2>
              <ProjectsCarousel
                key={projects.map((project) => project.id).join()}
                projects={projects}
              />
            </section>
          </FadeIn>
        ) : null}
        {hasStack ? (
          <FadeIn className="mt-14" delay={0.12}>
            <StackSection stack={profile.stack} />
          </FadeIn>
        ) : null}
        {hasLinks ? (
          <FadeIn className="mt-14" delay={0.16}>
            <FindMeSection links={profile.links} />
          </FadeIn>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
