import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: ReactNode;
	description?: ReactNode;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "default" | "danger";
	/** While true, buttons disable and the confirm button shows a spinner. */
	loading?: boolean;
	onConfirm: () => void;
	/** Extra content between description and actions (e.g. a reason field). */
	children?: ReactNode;
}

/**
 * Accessible confirmation dialog built on Radix AlertDialog. Replaces
 * `window.confirm()` and ad-hoc inline confirms with a consistent, focus-trapped
 * dialog. The confirm button does not auto-close so async work can complete —
 * the caller closes the dialog via `onOpenChange` when done.
 */
export default function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
	loading = false,
	onConfirm,
	children,
}: ConfirmDialogProps) {
	return (
		<AlertDialog.Root open={open} onOpenChange={onOpenChange}>
			<AlertDialog.Portal>
				<AlertDialog.Overlay className="app-modal__overlay" />
				<AlertDialog.Content
					className="app-confirm"
					{...(description ? {} : { "aria-describedby": undefined })}>
					<AlertDialog.Title className="app-confirm__title">
						{title}
					</AlertDialog.Title>
					{description && (
						<AlertDialog.Description className="app-confirm__desc">
							{description}
						</AlertDialog.Description>
					)}
					{children && <div className="app-confirm__body">{children}</div>}
					<div className="app-confirm__actions">
						<AlertDialog.Cancel asChild>
							<button
								type="button"
								className="btn btn--sm btn--outline"
								disabled={loading}>
								{cancelLabel}
							</button>
						</AlertDialog.Cancel>
						<AlertDialog.Action asChild>
							<button
								type="button"
								className={cn(
									"btn btn--sm",
									variant === "danger"
										? "btn--danger"
										: "btn--primary",
								)}
								disabled={loading}
								onClick={(e) => {
									// Keep the dialog open so async work can finish;
									// the caller closes it via onOpenChange.
									e.preventDefault();
									onConfirm();
								}}>
								{loading && (
									<span className="spinner" aria-hidden="true" />
								)}
								{confirmLabel}
							</button>
						</AlertDialog.Action>
					</div>
				</AlertDialog.Content>
			</AlertDialog.Portal>
		</AlertDialog.Root>
	);
}
