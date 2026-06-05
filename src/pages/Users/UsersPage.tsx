import { useState, useEffect, useRef } from "react";
import { usersService } from "@/services";
import type {
	AdminUser,
	AdminUserDetail,
	Pagination as PaginationType,
	UserEmotionItem,
} from "@/types/user";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { getInitials } from "@/utils/string";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/error";
import { notifySuccess, notifyError } from "@/utils/toast";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import "./UsersPage.css";

type ActiveFilter = "" | "true" | "false";
type EmotionPeriod = 30 | 90 | 365;

// ── Confirm dialog state for lock action ─────────────────────────────────────
interface LockConfirmState {
	open: boolean;
	reason: string;
}

// ── Emotion bars sub-component ────────────────────────────────────────────────
function EmotionBars({ data }: { data: UserEmotionItem[] }) {
	if (data.length === 0) {
		return (
			<p className="emotion-dist__empty">
				No emotion data for this period.
			</p>
		);
	}
	const max = Math.max(...data.map((d) => d.count), 1);
	return (
		<div className="emotion-bars">
			{data.map((item) => {
				const key = item.emotion.toLowerCase();
				return (
					<div
						key={item.emotion}
						className="emotion-bars__row">
						<span className="emotion-bars__label">
							{item.emotion.charAt(0) +
								item.emotion.slice(1).toLowerCase()}
						</span>
						<div className="emotion-bars__track">
							<div
								className={`emotion-bars__fill emotion-bars__fill--${key}`}
								style={{
									width: `${(item.count / max) * 100}%`,
								}}
							/>
						</div>
						<span className="emotion-bars__pct">
							{item.percentage.toFixed(1)}%
						</span>
					</div>
				);
			})}
		</div>
	);
}

export default function UsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [pagination, setPagination] = useState<PaginationType | null>(null);
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
		null,
	);
	const [modalLoading, setModalLoading] = useState(false);
	const [modalError, setModalError] = useState("");
	const [statusUpdating, setStatusUpdating] = useState(false);

	// Emotion distribution state
	const [emotionData, setEmotionData] = useState<UserEmotionItem[]>([]);
	const [emotionLoading, setEmotionLoading] = useState(false);
	const [emotionPeriod, setEmotionPeriod] = useState<EmotionPeriod>(30);

	// Lock confirm dialog state
	const [lockConfirm, setLockConfirm] = useState<LockConfirmState>({
		open: false,
		reason: "",
	});

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchUsers = async (
		currentPage: number,
		currentSearch: string,
		currentFilter: ActiveFilter,
	) => {
		setLoading(true);
		setError("");
		try {
			const data = await usersService.getUsers({
				page: currentPage,
				limit: 20,
				search: currentSearch || undefined,
				isActive: currentFilter || undefined,
			});
			setUsers(data.users);
			setPagination(data.pagination);
		} catch (error: unknown) {
			setError(
				getErrorMessage(
					error,
					"Failed to load users. Please try again.",
				),
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(page, search, activeFilter);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, activeFilter]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setPage(1);
			fetchUsers(1, value, activeFilter);
		}, 300);
	};

	const handleFilterChange = (value: ActiveFilter) => {
		setActiveFilter(value);
		setPage(1);
	};

	const fetchEmotionDistribution = async (
		userId: string,
		period: EmotionPeriod,
	) => {
		setEmotionLoading(true);
		try {
			const result = await usersService.getEmotionDistribution(
				userId,
				period,
			);
			setEmotionData(result.distribution);
		} catch {
			setEmotionData([]);
		} finally {
			setEmotionLoading(false);
		}
	};

	const handleOpenUserDetails = async (user: AdminUser) => {
		setSelectedUser({ ...user, streakDays: 0 });
		setModalError("");
		setModalLoading(true);
		setLockConfirm({ open: false, reason: "" });
		setEmotionData([]);
		setEmotionPeriod(30);

		try {
			const [detail] = await Promise.all([
				usersService.getUserDetail(user.id),
				fetchEmotionDistribution(user.id, 30),
			]);
			setSelectedUser(detail);
		} catch (error: unknown) {
			setModalError(
				getErrorMessage(
					error,
					"Failed to load user details. Please try again.",
				),
			);
		} finally {
			setModalLoading(false);
		}
	};

	const handleEmotionPeriodChange = (period: EmotionPeriod) => {
		if (!selectedUser) return;
		setEmotionPeriod(period);
		void fetchEmotionDistribution(selectedUser.id, period);
	};

	// ── Lock/Unlock user ────────────────────────────────────────────────────

	/** Called when user clicks "Lock account" — opens confirm dialog */
	const handleInitiateLock = () => {
		setLockConfirm({ open: true, reason: "" });
		setModalError("");
	};

	/** Confirm unlock (no dialog needed, no reason required by spec) */
	const handleUnlock = async () => {
		if (!selectedUser) return;
		setStatusUpdating(true);
		try {
			await usersService.updateUserStatus(selectedUser.id, true);
			setSelectedUser((prev) =>
				prev ? { ...prev, isActive: true } : prev,
			);
			setUsers((prev) =>
				prev.map((u) =>
					u.id === selectedUser.id ? { ...u, isActive: true } : u,
				),
			);
			notifySuccess(`Unlocked ${selectedUser.name}'s account.`);
		} catch (error: unknown) {
			notifyError(error, "Failed to unlock account. Please try again.");
		} finally {
			setStatusUpdating(false);
		}
	};

	/** Confirm lock with optional reason */
	const handleConfirmLock = async () => {
		if (!selectedUser) return;
		setStatusUpdating(true);
		try {
			await usersService.updateUserStatus(
				selectedUser.id,
				false,
				lockConfirm.reason.trim() || undefined,
			);
			setSelectedUser((prev) =>
				prev ? { ...prev, isActive: false } : prev,
			);
			setUsers((prev) =>
				prev.map((u) =>
					u.id === selectedUser.id ? { ...u, isActive: false } : u,
				),
			);
			notifySuccess(`Locked ${selectedUser.name}'s account.`);
			setLockConfirm({ open: false, reason: "" });
		} catch (error: unknown) {
			notifyError(error, "Failed to lock account. Please try again.");
		} finally {
			setStatusUpdating(false);
		}
	};

	const handleCancelLock = () => {
		setLockConfirm({ open: false, reason: "" });
	};

	// ─────────────────────────────────────────────────────────────────────────

	return (
		<div className="users-page">
			<div className="users-page__header">
				<h2 className="users-page__title">Users</h2>
				<p className="users-page__subtitle">
					{pagination
						? `${pagination.total.toLocaleString()} total users`
						: "Manage all users"}
				</p>
			</div>

			{/* Controls — spec params only: search + isActive */}
			<div className="users-page__controls">
				<label
					htmlFor="users-search"
					className="sr-only">
					Search users
				</label>
				<input
					id="users-search"
					type="search"
					className="users-page__search"
					placeholder="Search by email, username, or name..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<label
					htmlFor="users-filter"
					className="sr-only">
					Filter by status
				</label>
				<select
					id="users-filter"
					className="users-page__filter"
					value={activeFilter}
					onChange={(e) =>
						handleFilterChange(e.target.value as ActiveFilter)
					}>
					<option value="">All users</option>
					<option value="true">Active</option>
					<option value="false">Inactive</option>
				</select>
			</div>

			{error && <p className="users-page__error">{error}</p>}

			<div className="users-table-wrapper">
				<table
					className="users-table"
					aria-busy={loading}>
					<thead>
						<tr>
							<th>User</th>
							<th>Email</th>
							<th>Role</th>
							<th>Status</th>
							<th>Verified</th>
							<th>Last Login</th>
							<th>Joined</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr
									key={i}
									className="users-table__skeleton-row">
									{Array.from({ length: 7 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : users.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="users-table__empty">
									<div className="empty-state">
										<span className="empty-state__icon">
											👤
										</span>
										<span className="empty-state__title">
											No users found
										</span>
										<span className="empty-state__desc">
											Try adjusting your filters or search
											query
										</span>
									</div>
								</td>
							</tr>
						) : (
							users.map((user) => (
								<tr
									key={user.id}
									role="button"
									tabIndex={0}
									aria-haspopup="dialog"
									aria-label={`View details for ${user.name}`}
									onClick={() => handleOpenUserDetails(user)}
									onKeyDown={(e) => {
										if (
											e.key === "Enter" ||
											e.key === " "
										) {
											e.preventDefault();
											handleOpenUserDetails(user);
										}
									}}>
									<td>
										<div className="user-cell">
											<div
												className="user-avatar"
												aria-hidden="true">
												{getInitials(user.name)}
											</div>
											<div className="user-cell__info">
												<span className="user-cell__name">
													{user.name}
												</span>
											</div>
											{/* Tooltip */}
											<div
												className="user-cell__tooltip"
												role="tooltip">
												<span className="user-cell__tooltip-row">
													<span className="user-cell__tooltip-label">
														Username
													</span>
													<span>
														@{user.username}
													</span>
												</span>
												<span className="user-cell__tooltip-row">
													<span className="user-cell__tooltip-label">
														Email
													</span>
													<span>{user.email}</span>
												</span>
											</div>
										</div>
									</td>
									<td className="users-table__email">
										{user.email}
									</td>
									<td>
										<span className="badge badge--role">
											{user.role}
										</span>
									</td>
									<td>
										<span
											className={cn(
												"badge",
												user.isActive
													? "badge--active"
													: "badge--inactive",
											)}>
											{user.isActive
												? "● Active"
												: "○ Inactive"}
										</span>
									</td>
									<td>
										<span
											className={cn(
												"badge",
												user.isEmailVerified
													? "badge--verified"
													: "badge--unverified",
											)}>
											{user.isEmailVerified
												? "✓ Verified"
												: "Unverified"}
										</span>
									</td>
									<td className="users-table__date">
										{user.lastLoginAt
											? formatRelativeTime(
													user.lastLoginAt,
												)
											: "—"}
									</td>
									<td className="users-table__date">
										{formatDate(user.createdAt)}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{pagination && (
				<Pagination
					page={page}
					totalPages={pagination.totalPages}
					total={pagination.total}
					itemLabel="users"
					onPageChange={setPage}
				/>
			)}

			{/* ── User Detail Modal ─────────────────────────────────────────── */}
			{selectedUser && (
				<>
					<Modal
						open
						onOpenChange={(o) => {
							if (!o) setSelectedUser(null);
						}}
						title={`User details: ${selectedUser.name}`}
						hideTitle
						contentClassName="users-modal">
						{/* Header */}
						<div className="users-modal__header">
							<div className="users-modal__header-left">
								<div className="users-modal__avatar">
									{getInitials(selectedUser.name)}
								</div>
								<div>
									<div className="users-modal__name">
										{selectedUser.name}
									</div>
									<div className="users-modal__email">
										{selectedUser.email}
									</div>
								</div>
							</div>
							<button
								type="button"
								className="users-modal__close"
								onClick={() => setSelectedUser(null)}
								aria-label="Close details">
								✕
							</button>
						</div>

						{/* Body */}
						<div className="users-modal__body">
							<div className="users-modal__grid">
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Username
									</div>
									<div className="users-modal__card-value">
										@{selectedUser.username}
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Role
									</div>
									<div className="users-modal__card-value">
										{selectedUser.role}
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Status
									</div>
									<div className="users-modal__card-value">
										<span
											className={cn(
												"badge",
												selectedUser.isActive
													? "badge--active"
													: "badge--inactive",
											)}>
											{selectedUser.isActive
												? "● Active"
												: "○ Inactive"}
										</span>
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Email Verified
									</div>
									<div className="users-modal__card-value">
										<span
											className={cn(
												"badge",
												selectedUser.isEmailVerified
													? "badge--verified"
													: "badge--unverified",
											)}>
											{selectedUser.isEmailVerified
												? "✓ Verified"
												: "Unverified"}
										</span>
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Total Entries
									</div>
									<div className="users-modal__card-value">
										{selectedUser.entryCount.toLocaleString()}
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Streak Days
									</div>
									<div
										className={cn(
											"users-modal__card-value",
											modalLoading &&
												"users-modal__card-value--loading",
										)}>
										{modalLoading
											? "Loading..."
											: `${selectedUser.streakDays} days`}
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Joined
									</div>
									<div className="users-modal__card-value">
										{formatDate(selectedUser.createdAt)}
									</div>
								</div>
								<div className="users-modal__card">
									<div className="users-modal__card-label">
										Last Login
									</div>
									<div className="users-modal__card-value">
										{selectedUser.lastLoginAt
											? formatRelativeTime(
													selectedUser.lastLoginAt,
												)
											: "—"}
									</div>
								</div>
							</div>

							{/* Emotion Distribution */}
							<div className="users-modal__section-header">
								<div className="users-modal__section-title">
									Emotion Distribution
								</div>
								<div className="emotion-dist__periods">
									{([30, 90, 365] as EmotionPeriod[]).map(
										(p) => (
											<button
												key={p}
												type="button"
												className={cn(
													"emotion-dist__period-btn",
													emotionPeriod === p &&
														"emotion-dist__period-btn--active",
												)}
												onClick={() =>
													handleEmotionPeriodChange(p)
												}
												disabled={emotionLoading}>
												{p === 365 ? "1y" : `${p}d`}
											</button>
										),
									)}
								</div>
							</div>
							<div className="emotion-dist">
								{emotionLoading ? (
									<div className="emotion-dist__loading">
										<span className="skeleton skeleton--line" />
										<span className="skeleton skeleton--line" />
										<span className="skeleton skeleton--line" />
									</div>
								) : (
									<EmotionBars data={emotionData} />
								)}
							</div>

							{modalError && (
								<p className="users-modal__note--error">
									{modalError}
								</p>
							)}
						</div>

						{/* Actions — Lock/Unlock */}
						<div className="users-modal__actions">
							{selectedUser.isActive ? (
								<button
									type="button"
									className="users-modal__action-btn users-modal__action-btn--lock"
									onClick={handleInitiateLock}
									disabled={statusUpdating}>
									🔒 Lock account
								</button>
							) : (
								<button
									type="button"
									className="users-modal__action-btn users-modal__action-btn--unlock"
									onClick={handleUnlock}
									disabled={statusUpdating}>
									{statusUpdating && (
										<span
											className="spinner"
											aria-hidden="true"
										/>
									)}
									{statusUpdating
										? "Unlocking..."
										: "🔓 Unlock account"}
								</button>
							)}
						</div>
					</Modal>

					{/* Lock confirmation */}
					<ConfirmDialog
						open={lockConfirm.open}
						onOpenChange={(o) => {
							if (!o) handleCancelLock();
						}}
						title="🔒 Confirm account lock"
						description={
							<>
								This will immediately revoke all active sessions
								for <strong>{selectedUser.name}</strong>.
							</>
						}
						confirmLabel="Lock account"
						variant="danger"
						loading={statusUpdating}
						onConfirm={handleConfirmLock}>
						<label
							className="users-modal__card-label"
							htmlFor="lock-reason">
							Reason{" "}
							<span className="users-modal__lock-optional">
								(optional)
							</span>
						</label>
						<textarea
							id="lock-reason"
							className="users-modal__lock-reason"
							rows={3}
							maxLength={500}
							value={lockConfirm.reason}
							onChange={(e) =>
								setLockConfirm((prev) => ({
									...prev,
									reason: e.target.value,
								}))
							}
							placeholder="e.g. Suspicious activity..."
						/>
					</ConfirmDialog>
				</>
			)}
		</div>
	);
}
