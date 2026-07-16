export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export type Project = {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: ProjectStatus;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = {
  name: string;
  description: string;
  dueDate: string;
  status: ProjectStatus;
  memberIds: string[];
};
