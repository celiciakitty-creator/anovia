"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { RevealOnScroll } from "@/components/motion";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { MainLayout } from "@/components/layout";
import { Button, DeleteConfirmModal, EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { useWorkspace } from "@/components/workspace";
import type { EnrichedProject } from "@/lib/workspace-utils";

function ProjectsPageContent() {
  const { projects, deleteProject } = useWorkspace();
  const searchParams = useSearchParams();
  const shouldOpenCreate = searchParams.get("create") === "1";
  const [formOpen, setFormOpen] = useState(shouldOpenCreate);
  const [editingProject, setEditingProject] = useState<EnrichedProject | undefined>();
  const [deletingProject, setDeletingProject] = useState<EnrichedProject | undefined>();

  const openCreate = () => {
    setEditingProject(undefined);
    setFormOpen(true);
  };

  const copy = PAGE_EMPTY_STATES.projects;

  const openEdit = (project: EnrichedProject) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  return (
    <MainLayout subtitle="Projects">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Projects
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage workstreams, timelines, and team assignments.
              </p>
            </div>
            <Button onClick={openCreate}>Create Project</Button>
          </div>
        </RevealOnScroll>

        {projects.length === 0 ? (
          <RevealOnScroll delay={80}>
            <EmptyState
              title={copy.title}
              description={copy.description}
              kizunaMessage={copy.kizunaMessage}
              emoji={copy.emoji}
              actionLabel={copy.actionLabel}
              onAction={openCreate}
            />
          </RevealOnScroll>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <RevealOnScroll key={project.id} delay={index * 40}>
                <ProjectCard
                  project={project}
                  onEdit={openEdit}
                  onDelete={setDeletingProject}
                />
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        project={editingProject}
      />

      <DeleteConfirmModal
        open={Boolean(deletingProject)}
        onClose={() => setDeletingProject(undefined)}
        onConfirm={() => {
          if (deletingProject) deleteProject(deletingProject.id);
        }}
        title="Delete project"
        description={`Are you sure you want to delete "${deletingProject?.name}"? All associated tasks will also be removed.`}
      />
    </MainLayout>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <MainLayout subtitle="Projects">
          <p className="text-sm text-muted-foreground">Loading projects…</p>
        </MainLayout>
      }
    >
      <ProjectsPageContent />
    </Suspense>
  );
}
