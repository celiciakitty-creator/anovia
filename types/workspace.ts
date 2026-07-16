import type { CalendarEvent } from "./calendar";
import type { CompletionMeta } from "./completion";
import type { Label, Task } from "./task";
import type { Project } from "./project";
import type { User } from "./user";

export type WorkspaceData = {
  users: User[];
  projects: Project[];
  tasks: Task[];
  labels: Label[];
  events: CalendarEvent[];
  completionMeta: CompletionMeta;
};
