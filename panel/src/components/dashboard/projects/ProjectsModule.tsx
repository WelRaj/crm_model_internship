"use client";

import ProjectHub from "./ProjectHub";

type ProjectView = "projects" | "team-tracking" | "tasks" | "milestones" | "deadlines";

export default function ProjectsModule({
  activeView = "projects",
}: {
  activeView?: ProjectView;
}) {
  return <ProjectHub activeView={activeView} />;
}
