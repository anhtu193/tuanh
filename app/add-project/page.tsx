import ProjectForm from "@/components/admin/ProjectForm";
import { getSessionUser } from "@/lib/auth";
import { getProject } from "@/lib/projects";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Add project",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AddProjectPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin");
  }

  const { id } = await searchParams;
  const project = id ? await getProject(id) : null;
  if (id && !project) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-16">
      <ProjectForm project={project} />
    </div>
  );
}
