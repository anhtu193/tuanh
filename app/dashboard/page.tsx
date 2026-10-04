import ProfileEditor from "@/components/admin/ProfileEditor";
import ProjectDashboard from "@/components/admin/ProjectDashboard";
import { getSessionUser } from "@/lib/auth";
import { getSiteProfile } from "@/lib/profile";
import { listProjects } from "@/lib/projects";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin");
  }

  const [projects, profile] = await Promise.all([
    listProjects(),
    getSiteProfile(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-14 px-6 py-16">
      <ProfileEditor
        key={`${profile.stack.map((item) => item.icon).join()}|${profile.links.map((link) => `${link.label}:${link.url}`).join()}`}
        initialProfile={profile}
      />
      <ProjectDashboard
        key={projects.map((project) => project.id).join()}
        initialProjects={projects}
      />
    </div>
  );
}
