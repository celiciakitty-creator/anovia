"use client";

import { useState } from "react";
import { Button, Input, Modal, Select, Textarea } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { validateCalendarEventInput } from "@/lib/validation";
import type { CalendarEvent, CalendarEventInput, StoredEventType } from "@/types/calendar";
import { STORED_EVENT_TYPE_LABELS } from "@/types/calendar";

type EventFormProps = {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  defaultDate?: string;
  onSaved?: () => void;
};

const TYPE_OPTIONS = Object.entries(STORED_EVENT_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

const emptyForm: CalendarEventInput = {
  title: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  type: "meeting",
  projectId: null,
  description: "",
};

function eventToForm(event: CalendarEvent): CalendarEventInput {
  return {
    title: event.title,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    type: event.type,
    projectId: event.projectId,
    description: event.description,
  };
}

type EventFormContentProps = {
  event?: CalendarEvent;
  defaultDate?: string;
  onClose: () => void;
  onSaved?: () => void;
};

function EventFormContent({
  event,
  defaultDate,
  onClose,
  onSaved,
}: EventFormContentProps) {
  const { projects, createEvent, updateEvent } = useWorkspace();
  const isEditing = Boolean(event);
  const [form, setForm] = useState<CalendarEventInput>(() =>
    event
      ? eventToForm(event)
      : {
          ...emptyForm,
          date: defaultDate ?? "",
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (eventSubmit: React.FormEvent) => {
    eventSubmit.preventDefault();
    if (isSubmitting) return;

    const result = validateCalendarEventInput(form);
    setErrors(result.errors);
    if (!result.valid) return;

    setIsSubmitting(true);

    try {
      if (event) {
        await updateEvent(event.id, form);
      } else {
        await createEvent(form);
      }
      onSaved?.();
      onClose();
    } catch (error) {
      setErrors({
        title:
          error instanceof Error
            ? error.message
            : "Unable to save this calendar event.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectOptions = [
    { value: "", label: "No project" },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        error={errors.title}
        required
      />
      <Input
        label="Date"
        name="date"
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        error={errors.date}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Start time"
          name="startTime"
          type="time"
          value={form.startTime}
          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          error={errors.startTime}
          required
        />
        <Input
          label="End time"
          name="endTime"
          type="time"
          value={form.endTime}
          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          error={errors.endTime}
          required
        />
      </div>
      <Select
        label="Type"
        name="type"
        value={form.type}
        onChange={(e) =>
          setForm({ ...form, type: e.target.value as StoredEventType })
        }
        options={TYPE_OPTIONS}
      />
      <Select
        label="Project (optional)"
        name="projectId"
        value={form.projectId ?? ""}
        onChange={(e) =>
          setForm({
            ...form,
            projectId: e.target.value ? e.target.value : null,
          })
        }
        options={projectOptions}
      />
      <Textarea
        label="Description (optional)"
        name="description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting
            ? "Saving…"
            : isEditing
              ? "Save changes"
              : "Add event"}
        </Button>
      </div>
    </form>
  );
}

export function EventForm({
  open,
  onClose,
  event,
  defaultDate,
  onSaved,
}: EventFormProps) {
  const isEditing = Boolean(event);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit event" : "Add event"}
      description={
        isEditing
          ? "Update calendar event details."
          : "Schedule a meeting, focus session, or wellness reminder."
      }
    >
      {open ? (
        <EventFormContent
          key={event?.id ?? `create-${defaultDate ?? ""}`}
          event={event}
          defaultDate={defaultDate}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
