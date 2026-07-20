"use client";

import { useCallback, useState } from "react";
import { ScrollContainerProvider } from "./ScrollContainerContext";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { WorkspaceLoadAlert } from "@/components/workspace";

type MainLayoutProps = {
  children: React.ReactNode;
  subtitle?: string;
};

export function MainLayout({ children, subtitle }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);

  const setMainRef = useCallback((node: HTMLElement | null) => {
    setScrollRoot(node);
  }, []);

  return (
    <ScrollContainerProvider scrollRoot={scrollRoot}>
      <div className="flex h-dvh overflow-hidden bg-background">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
        ) : null}

        <Sidebar
          isOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopNavbar
            subtitle={subtitle}
            scrollRoot={scrollRoot}
            onMenuToggle={() => setSidebarOpen((open) => !open)}
          />
          <main
            ref={setMainRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6"
          >
            <WorkspaceLoadAlert />
            {children}
          </main>
        </div>
      </div>
    </ScrollContainerProvider>
  );
}
