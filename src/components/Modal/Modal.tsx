import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface ModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Accessible dialog title. Rendered visibly unless `hideTitle` is set. */
	title: ReactNode;
	/** Render the title visually hidden (still announced to screen readers). */
	hideTitle?: boolean;
	/** Class applied to the visible title node. */
	titleClassName?: string;
	/** Class for the Radix content box — carries the modal's box styling. */
	contentClassName: string;
	/** Class for the dimmed backdrop. */
	overlayClassName?: string;
	children: ReactNode;
}

/**
 * Accessible modal built on Radix Dialog: focus trap, Escape-to-close,
 * outside-click-to-close, body scroll lock and focus restoration come for free.
 * Pages keep their existing CSS by passing `contentClassName`.
 */
export default function Modal({
	open,
	onOpenChange,
	title,
	hideTitle = false,
	titleClassName,
	contentClassName,
	overlayClassName = "app-modal__overlay",
	children,
}: ModalProps) {
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className={overlayClassName} />
				<Dialog.Content
					className={contentClassName}
					aria-describedby={undefined}>
					<Dialog.Title
						className={hideTitle ? "sr-only" : titleClassName}>
						{title}
					</Dialog.Title>
					{children}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
