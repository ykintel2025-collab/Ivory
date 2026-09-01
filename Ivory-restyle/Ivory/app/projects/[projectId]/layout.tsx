import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", params.projectId)
    .single();

  // RLS zorgt dat dit leeg blijft als de gebruiker geen lid is van dit project
  if (!project) redirect("/projects");

  return (
    <AppShell projectId={params.projectId} projectName={project.name}>
      {children}
    </AppShell>
  );
}
