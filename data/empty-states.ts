/** Branded empty-state copy for Anovia — warm tone, one CTA, optional Kizuna line. */

export type EmptyStateCopy = {
  title: string;
  description: string;
  kizunaMessage?: string;
  emoji?: string;
  actionLabel?: string;
};

export const PAGE_EMPTY_STATES = {
  projects: {
    title: "No projects yet",
    description:
      "Projects are home for your workstreams — tasks, timelines, and progress live here.",
    kizunaMessage:
      "Starting one project gives everything else a place to land. Even a small first step counts.",
    emoji: "📁",
    actionLabel: "Create Project",
  },
  tasks: {
    title: "No tasks yet",
    description:
      "Tasks help you track work across projects — from first idea to done.",
    kizunaMessage:
      "Pick one small task to begin. Momentum grows from tiny wins, not perfect plans.",
    emoji: "✅",
    actionLabel: "Create task",
  },
  calendarUpcoming: {
    title: "Your calendar is open",
    description:
      "Meetings, focus blocks, and deadlines will gather here as you add events and due dates.",
    kizunaMessage:
      "A single event or task due date is enough to bring this view to life.",
    emoji: "📅",
    actionLabel: "Add event",
  },
  calendarDay: {
    title: "Nothing on this day",
    description:
      "This day is free — add a meeting, focus session, or wellness reminder whenever you're ready.",
    kizunaMessage:
      "Open space on your calendar is a gift. Fill it only with what matters to you.",
    emoji: "🌤️",
    actionLabel: "Add Event",
  },
  calendarDashboard: {
    title: "Nothing scheduled soon",
    description:
      "Upcoming events and deadlines from your calendar will appear here.",
    kizunaMessage:
      "Head to the calendar to plan your next focus block or check what's due.",
    emoji: "📅",
    actionLabel: "Open calendar",
  },
  projectsDashboard: {
    title: "No active projects",
    description:
      "Active projects show progress and due dates at a glance on your dashboard.",
    kizunaMessage:
      "Create a project when you're ready — Kizuna will help you spot what needs attention.",
    emoji: "📁",
    actionLabel: "Create project",
  },
  tasksDashboard: {
    title: "No urgent tasks",
    description:
      "High-priority and due-soon tasks surface here so you can focus without hunting.",
    kizunaMessage:
      "You're in a calm spot right now. Enjoy it, or add a task when inspiration strikes.",
    emoji: "✨",
    actionLabel: "View tasks",
  },
  completedTasks: {
    title: "No completed tasks yet",
    description:
      "Finished work lands here — a quiet record of progress you can revisit anytime.",
    kizunaMessage:
      "Your first completion will show up here. I'll celebrate it with you.",
    emoji: "🎉",
    actionLabel: "Go to tasks",
  },
  activity: {
    title: "No recent activity",
    description:
      "Task completions and project updates will appear here as your workspace grows.",
    kizunaMessage:
      "Complete a task or update a project — I'll help this feed tell your progress story.",
    emoji: "📋",
    actionLabel: "View tasks",
  },
  reminders: {
    title: "All clear",
    description:
      "Kizuna reminders about deadlines, wellness, and progress will appear here when helpful.",
    kizunaMessage:
      "Enjoy the calm — I'll reach out gently when something might support your day.",
    emoji: "🔔",
    actionLabel: "Open dashboard",
  },
  remindersDashboard: {
    title: "No reminders right now",
    description:
      "Smart nudges about deadlines, projects, and wellness show up here when relevant.",
    kizunaMessage:
      "You're in a good place. I'll check in when something useful comes up.",
    emoji: "✨",
    actionLabel: "Ask Kizuna",
  },
  kanbanColumn: {
    title: "Nothing here yet",
    description: "Drag work forward or create a task in this column when you're ready.",
    emoji: "—",
  },
  commentsProject: {
    title: "No discussion yet",
    description:
      "Share project updates, decisions, and ideas here — everything stays linked to this project.",
    kizunaMessage:
      "A short update or question is a great way to keep momentum visible.",
    emoji: "💬",
    actionLabel: "Add comment",
  },
  commentsTask: {
    title: "No comments yet",
    description:
      "Note blockers, ask questions, or leave review feedback tied to this task.",
    kizunaMessage:
      "Even a quick status note helps future-you remember where things left off.",
    emoji: "💬",
    actionLabel: "Add comment",
  },
  commentsTeam: {
    title: "Start the conversation",
    description:
      "Share team announcements, ideas, and questions in one place while collaboration features arrive.",
    kizunaMessage:
      "Your notes here stay on this device for now — perfect for drafts and personal planning.",
    emoji: "👥",
    actionLabel: "Post to team",
  },
} as const satisfies Record<string, EmptyStateCopy>;

export const KANBAN_COLUMN_EMPTY_HINT =
  "Room for your next step — add a task when this stage is ready for you.";
