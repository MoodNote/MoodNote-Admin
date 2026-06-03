import { toast } from "sonner";
import { getErrorMessage } from "./error";

/** Show a success toast. */
export function notifySuccess(message: string): void {
	toast.success(message);
}

/** Show an error toast, resolving the message from any thrown error. */
export function notifyError(error: unknown, fallback?: string): void {
	toast.error(getErrorMessage(error, fallback));
}

/** Show a neutral/info toast. */
export function notifyInfo(message: string): void {
	toast(message);
}
