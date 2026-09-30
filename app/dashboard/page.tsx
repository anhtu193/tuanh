import ProjectDashboard from "@/components/admin/ProjectDashboard";
import { getSessionUser } from "@/lib/auth";
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

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-16">
      <ProjectDashboard initialProjects={await listProjects()} />
    </div>
  );
}
