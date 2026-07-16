export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

export function validateProjectInput(input: {
  name: string;
  description: string;
  dueDate: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) {
    errors.name = "Project name is required.";
  } else if (input.name.trim().length < 2) {
    errors.name = "Project name must be at least 2 characters.";
  }

  if (!input.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateTaskInput(input: {
  title: string;
  projectId: string;
  dueDate: string;
  estimatedMinutes: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title.trim()) {
    errors.title = "Task title is required.";
  } else if (input.title.trim().length < 2) {
    errors.title = "Task title must be at least 2 characters.";
  }

  if (!input.projectId) {
    errors.projectId = "Project is required.";
  }

  if (!input.dueDate) {
    errors.dueDate = "Due date is required.";
  }

  if (input.estimatedMinutes < 0) {
    errors.estimatedMinutes = "Estimated time cannot be negative.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCalendarEventInput(input: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.title.trim()) {
    errors.title = "Event title is required.";
  } else if (input.title.trim().length < 2) {
    errors.title = "Event title must be at least 2 characters.";
  }

  if (!input.date) {
    errors.date = "Date is required.";
  }

  if (!input.startTime) {
    errors.startTime = "Start time is required.";
  }

  if (!input.endTime) {
    errors.endTime = "End time is required.";
  }

  if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    errors.endTime = "End time must be after start time.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
