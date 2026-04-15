import { __ } from "@wordpress/i18n";
import { Modal, Button } from "@wordpress/components";

export default function DeleteFormModal({
  deleteTarget,
  onClose,
  onForceDelete,
  isDeleting,
}) {
  if (!deleteTarget) {
    return null;
  }

  return (
    <Modal title={__("Delete form", "kreebi-forms")} onRequestClose={onClose}>
      <p>
        {__(
          "Deleting this form will permanently remove the form and all of its submissions. This cannot be undone.",
          "kreebi-forms",
        )}
      </p>
      <div className="krefrm-modal-actions">
        <Button onClick={onClose}>{__("Cancel", "kreebi-forms")}</Button>
        <Button
          variant="primary"
          isDestructive
          isBusy={isDeleting}
          onClick={onForceDelete}
        >
          {__("Force Delete", "kreebi-forms")}
        </Button>
      </div>
    </Modal>
  );
}
