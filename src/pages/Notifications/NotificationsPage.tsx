import { useState } from "react";
import type { FormEvent } from "react";
import { notificationService } from "@/services";
import type { AdminUser } from "@/types/user";
import { getErrorMessage, isApiError } from "@/utils/error";
import { notifySuccess } from "@/utils/toast";
import UserMultiSelect from "@/components/UserMultiSelect/UserMultiSelect";
import "./NotificationsPage.css";

type Tab = "broadcast" | "send";

interface FormState {
	title: string;
	message: string;
}

const EMPTY_FORM: FormState = { title: "", message: "" };

const MAX_RECIPIENTS = 500;

function parseMetadata(raw: string): {
	metadata?: Record<string, unknown>;
	error?: string;
} {
	if (!raw.trim()) return {};

	try {
		const parsed: unknown = JSON.parse(raw);
		if (
			parsed === null ||
			typeof parsed !== "object" ||
			Array.isArray(parsed)
		) {
			return { error: "Metadata must be a JSON object." };
		}
		return { metadata: parsed as Record<string, unknown> };
	} catch {
		return { error: "Metadata must be valid JSON." };
	}
}

function getApiErrorMessage(error: unknown, fallback: string): string {
	if (isApiError(error) && error.status === 429) {
		return "Rate limit reached. Please wait before sending again.";
	}

	return getErrorMessage(error, fallback);
}

export default function NotificationsPage() {
	const [tab, setTab] = useState<Tab>("broadcast");

	// Broadcast state
	const [broadcast, setBroadcast] = useState<FormState>(EMPTY_FORM);
	const [broadcastLoading, setBroadcastLoading] = useState(false);
	const [broadcastError, setBroadcastError] = useState("");
	const [broadcastMetadataRaw, setBroadcastMetadataRaw] = useState("");

	// Send state
	const [send, setSend] = useState<FormState>(EMPTY_FORM);
	const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([]);
	const [sendLoading, setSendLoading] = useState(false);
	const [sendError, setSendError] = useState("");
	const [sendMetadataRaw, setSendMetadataRaw] = useState("");

	const handleBroadcast = async (e: FormEvent) => {
		e.preventDefault();
		setBroadcastError("");

		if (!broadcast.title.trim() || !broadcast.message.trim()) {
			setBroadcastError("Title and message are required.");
			return;
		}
		if (broadcast.title.length > 100) {
			setBroadcastError("Title must be 100 characters or fewer.");
			return;
		}
		if (broadcast.message.length > 1000) {
			setBroadcastError("Message must be 1000 characters or fewer.");
			return;
		}

		const parsedMetadata = parseMetadata(broadcastMetadataRaw);
		if (parsedMetadata.error) {
			setBroadcastError(parsedMetadata.error);
			return;
		}

		setBroadcastLoading(true);
		try {
			const result = await notificationService.broadcast({
				title: broadcast.title,
				message: broadcast.message,
				type: "SYSTEM",
				metadata: parsedMetadata.metadata,
			});
			notifySuccess(`Broadcast sent to ${result.sent} users.`);
			setBroadcast(EMPTY_FORM);
			setBroadcastMetadataRaw("");
		} catch (error: unknown) {
			setBroadcastError(
				getApiErrorMessage(
					error,
					"Failed to send broadcast. Please try again.",
				),
			);
		} finally {
			setBroadcastLoading(false);
		}
	};

	const handleSend = async (e: FormEvent) => {
		e.preventDefault();
		setSendError("");

		const userIds = selectedUsers.map((u) => u.id);

		if (userIds.length === 0) {
			setSendError("Please select at least one user.");
			return;
		}
		if (userIds.length > MAX_RECIPIENTS) {
			setSendError(
				`You can send to at most ${MAX_RECIPIENTS} users at once.`,
			);
			return;
		}

		if (!send.title.trim() || !send.message.trim()) {
			setSendError("Title and message are required.");
			return;
		}
		if (send.title.length > 100) {
			setSendError("Title must be 100 characters or fewer.");
			return;
		}
		if (send.message.length > 1000) {
			setSendError("Message must be 1000 characters or fewer.");
			return;
		}

		const parsedMetadata = parseMetadata(sendMetadataRaw);
		if (parsedMetadata.error) {
			setSendError(parsedMetadata.error);
			return;
		}

		setSendLoading(true);
		try {
			const data = await notificationService.sendToUsers({
				userIds,
				title: send.title,
				message: send.message,
				type: "SYSTEM",
				metadata: parsedMetadata.metadata,
			});
			notifySuccess(`Sent ${data.sent} / ${data.requested} requested.`);
			setSend(EMPTY_FORM);
			setSelectedUsers([]);
			setSendMetadataRaw("");
		} catch (error: unknown) {
			setSendError(
				getApiErrorMessage(
					error,
					"Failed to send notification. Please try again.",
				),
			);
		} finally {
			setSendLoading(false);
		}
	};

	return (
		<div className="notifications-page">
			<div className="notifications-page__header">
				<h2 className="notifications-page__title">Notifications</h2>
				<p className="notifications-page__subtitle">
					Send notifications to users
				</p>
			</div>

			<div className="notifications-tabs">
				<button
					className={`notifications-tab ${tab === "broadcast" ? "notifications-tab--active" : ""}`}
					onClick={() => setTab("broadcast")}>
					Broadcast
				</button>
				<button
					className={`notifications-tab ${tab === "send" ? "notifications-tab--active" : ""}`}
					onClick={() => setTab("send")}>
					Send to specific users
				</button>
			</div>

			<div className="notifications-card">
				{tab === "broadcast" && (
					<form
						className="notification-form"
						onSubmit={handleBroadcast}
						noValidate>
						<p className="notification-form__desc">
							Send a notification to{" "}
							<strong>all active, verified users</strong>.
						</p>

						{broadcastError && (
							<p className="notification-form__error">
								{broadcastError}
							</p>
						)}

						<div className="notification-form__group">
							<label
								className="notification-form__label"
								htmlFor="broadcast-title">
								Title{" "}
								<span className="notification-form__hint">
									(max 100)
								</span>
							</label>
							<input
								id="broadcast-title"
								type="text"
								className="notification-form__input"
								maxLength={100}
								value={broadcast.title}
								onChange={(e) =>
									setBroadcast((s) => ({
										...s,
										title: e.target.value,
									}))
								}
								placeholder="Notification title"
							/>
							<span className="notification-form__counter">
								{broadcast.title.length}/100
							</span>
						</div>

						<div className="notification-form__group">
							<label
								className="notification-form__label"
								htmlFor="broadcast-message">
								Message{" "}
								<span className="notification-form__hint">
									(max 1000)
								</span>
							</label>
							<textarea
								id="broadcast-message"
								className="notification-form__textarea"
								maxLength={1000}
								rows={5}
								value={broadcast.message}
								onChange={(e) =>
									setBroadcast((s) => ({
										...s,
										message: e.target.value,
									}))
								}
								placeholder="Notification message..."
							/>
							<span className="notification-form__counter">
								{broadcast.message.length}/1000
							</span>
						</div>

						<details className="notification-form__advanced">
							<summary className="notification-form__advanced-summary">
								Advanced options
							</summary>
							<div className="notification-form__group">
								<label
									className="notification-form__label"
									htmlFor="broadcast-metadata">
									Metadata JSON{" "}
									<span className="notification-form__hint">
										(optional object)
									</span>
								</label>
								<textarea
									id="broadcast-metadata"
									className="notification-form__textarea"
									rows={4}
									value={broadcastMetadataRaw}
									onChange={(e) =>
										setBroadcastMetadataRaw(e.target.value)
									}
									placeholder={'{\n  "link": "/maintenance"\n}'}
								/>
							</div>
						</details>

						<button
							type="submit"
							className="notification-form__submit"
							disabled={broadcastLoading}>
							{broadcastLoading && (
								<span className="spinner" aria-hidden="true" />
							)}
							{broadcastLoading ? "Sending..." : "Send broadcast"}
						</button>
					</form>
				)}

				{tab === "send" && (
					<form
						className="notification-form"
						onSubmit={handleSend}
						noValidate>
						<p className="notification-form__desc">
							Send a notification to{" "}
							<strong>specific users</strong>. Search and pick
							recipients below. Users who are inactive or unverified
							will be skipped.
						</p>

						{sendError && (
							<p className="notification-form__error">
								{sendError}
							</p>
						)}

						<div className="notification-form__group">
							<label
								className="notification-form__label"
								htmlFor="user-search">
								Recipients{" "}
								<span className="notification-form__hint">
									(max {MAX_RECIPIENTS})
								</span>
							</label>
							<UserMultiSelect
								inputId="user-search"
								value={selectedUsers}
								onChange={setSelectedUsers}
								max={MAX_RECIPIENTS}
							/>
						</div>

						<div className="notification-form__group">
							<label
								className="notification-form__label"
								htmlFor="send-title">
								Title{" "}
								<span className="notification-form__hint">
									(max 100)
								</span>
							</label>
							<input
								id="send-title"
								type="text"
								className="notification-form__input"
								maxLength={100}
								value={send.title}
								onChange={(e) =>
									setSend((s) => ({
										...s,
										title: e.target.value,
									}))
								}
								placeholder="Notification title"
							/>
							<span className="notification-form__counter">
								{send.title.length}/100
							</span>
						</div>

						<div className="notification-form__group">
							<label
								className="notification-form__label"
								htmlFor="send-message">
								Message{" "}
								<span className="notification-form__hint">
									(max 1000)
								</span>
							</label>
							<textarea
								id="send-message"
								className="notification-form__textarea"
								maxLength={1000}
								rows={5}
								value={send.message}
								onChange={(e) =>
									setSend((s) => ({
										...s,
										message: e.target.value,
									}))
								}
								placeholder="Notification message..."
							/>
							<span className="notification-form__counter">
								{send.message.length}/1000
							</span>
						</div>

						<details className="notification-form__advanced">
							<summary className="notification-form__advanced-summary">
								Advanced options
							</summary>
							<div className="notification-form__group">
								<label
									className="notification-form__label"
									htmlFor="send-metadata">
									Metadata JSON{" "}
									<span className="notification-form__hint">
										(optional object)
									</span>
								</label>
								<textarea
									id="send-metadata"
									className="notification-form__textarea"
									rows={4}
									value={sendMetadataRaw}
									onChange={(e) =>
										setSendMetadataRaw(e.target.value)
									}
									placeholder={'{\n  "campaign": "streak-30"\n}'}
								/>
							</div>
						</details>

						<button
							type="submit"
							className="notification-form__submit"
							disabled={sendLoading}>
							{sendLoading && (
								<span className="spinner" aria-hidden="true" />
							)}
							{sendLoading ? "Sending..." : "Send notification"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
