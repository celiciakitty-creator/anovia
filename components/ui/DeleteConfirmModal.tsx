"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
};

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onConfirm();
      onClose();
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Unable to delete item."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      {deleteError ? (
        <p className="mb-4 text-sm text-danger" role="alert">
          {deleteError}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            void handleConfirm();
          }}
          disabled={isDeleting}
          className="bg-danger text-primary-foreground hover:bg-danger/90"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
