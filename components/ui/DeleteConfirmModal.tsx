"use client";

import { Button, Modal } from "@/components/ui";

type DeleteConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="bg-danger text-primary-foreground hover:bg-danger/90"
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
