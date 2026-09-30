import FadeIn from "@/components/FadeIn";
import ProjectsCarousel from "@/components/projects/ProjectsCarousel";
import SiteFooter from "@/components/SiteFooter";
import { listProjects } from "@/lib/projects";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const projects = await listProjects({ visibleOnly: true });
  const hasProjects = projects.length > 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-16 sm:px-6 md:px-8">
      <main className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-md max-md:pr-44">
          <h1 className="text-3xl font-semibold tracking-tight">tuanh</h1>
          <p className="mt-4 text-lg leading-8 text-foreground/70 whitespace-pre-line">
            A small place for things I build.
            {hasProjects
              ? " \nExperiments, tools, and side projects."
              : " Projects will live here soon."}
          </p>
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
      </main>
      <SiteFooter />
    </div>
  );
}
