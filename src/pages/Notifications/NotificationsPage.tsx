import { useState } from "react";
import type { FormEvent } from "react";
import { notificationService } from "@/services";
import { getErrorMessage, isApiError } from "@/utils/error";
import "./NotificationsPage.css";

type Tab = "broadcast" | "send";

interface FormState {
	title: string;
	message: string;
}

const EMPTY_FORM: FormState = { title: "", message: "" };

const UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function findInvalidUserId(userIds: string[]): string | null {
	return userIds.find((id) => !UUID_REGEX.test(id)) ?? null;
}

export default function NotificationsPage() {
	const [tab, setTab] = useState<Tab>("broadcast");

	// Broadcast state
	const [broadcast, setBroadcast] = useState<FormState>(EMPTY_FORM);
	const [broadcastLoading, setBroadcastLoading] = useState(false);
	const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
	const [broadcastError, setBroadcastError] = useState("");
	const [broadcastMetadataRaw, setBroadcastMetadataRaw] = useState("");

	// Send state
	const [send, setSend] = useState<FormState>(EMPTY_FORM);
	const [userIdsRaw, setUserIdsRaw] = useState("");
	const [sendLoading, setSendLoading] = useState(false);
	const [sendResult, setSendResult] = useState<string | null>(null);
	const [sendError, setSendError] = useState("");
	const [sendMetadataRaw, setSendMetadataRaw] = useState("");

	const handleBroadcast = async (e: FormEvent) => {
		e.preventDefault();
		setBroadcastError("");
		setBroadcastResult(null);

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
			setBroadcastResult(`Sent to ${result.sent} users.`);
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
		setSendResult(null);

		const userIds = userIdsRaw
			.split("\n")
			.map((s) => s.trim())
			.filter(Boolean);

		if (userIds.length === 0) {
			setSendError("Please enter at least one user ID.");
			return;
		}
		if (userIds.length > 500) {
			setSendError("You can send to at most 500 users at once.");
			return;
		}

		const invalidUserId = findInvalidUserId(userIds);
		if (invalidUserId) {
			setSendError(`Invalid user ID format: ${invalidUserId}`);
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
			setSendResult(`Sent ${data.sent} / ${data.requested} requested.`);
			setSend(EMPTY_FORM);
			setUserIdsRaw("");
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
						{broadcastResult && (
							<p className="notification-form__success">
								{broadcastResult}
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

						<button
							type="submit"
							className="notification-form__submit"
							disabled={broadcastLoading}>
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
							<strong>specific users</strong> by their IDs. Users
							who are inactive or unverified will be skipped.
						</p>

						{sendError && (
							<p className="notification-form__error">
								{sendError}
							</p>
						)}
						{sendResult && (
							<p className="notification-form__success">
								{sendResult}
							</p>
						)}

						<div className="notification-form__group">
							<label
								className="notification-form__label"
								htmlFor="user-ids">
								User IDs{" "}
								<span className="notification-form__hint">
									(one per line, max 500)
								</span>
							</label>
							<textarea
								id="user-ids"
								className="notification-form__textarea"
								rows={4}
								value={userIdsRaw}
								onChange={(e) => setUserIdsRaw(e.target.value)}
								placeholder={"uuid-1\nuuid-2\nuuid-3"}
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

						<button
							type="submit"
							className="notification-form__submit"
							disabled={sendLoading}>
							{sendLoading ? "Sending..." : "Send notification"}
						</button>
					</form>
				)}
			</div>
		</div>
	);
}
