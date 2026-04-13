import { useState, useEffect, useRef } from "react";
import { usersService } from "@/services";
import type { AdminUser, AdminUserDetail, Pagination } from "@/types/user";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/error";
import "./UsersPage.css";

type ActiveFilter = "" | "true" | "false";

// ── Confirm dialog state for lock action ─────────────────────────────────────
interface LockConfirmState {
	open: boolean;
	reason: string;
}

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((n) => n[0].toUpperCase())
		.join("");
}

function buildPageNumbers(
	currentPage: number,
	totalPages: number,
): (number | "...")[] {
	if (totalPages <= 7) {
		return Array.from({ length: totalPages }, (_, i) => i + 1);
	}
	const pages: (number | "...")[] = [1];
	if (currentPage > 3) pages.push("...");
	for (
		let i = Math.max(2, currentPage - 1);
		i <= Math.min(totalPages - 1, currentPage + 1);
		i++
	) {
		pages.push(i);
	}
	if (currentPage < totalPages - 2) pages.push("...");
	pages.push(totalPages);
	return pages;
}

export default function UsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
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

	const handleOpenUserDetails = async (user: AdminUser) => {
		setSelectedUser({ ...user, streakDays: 0 });
		setModalError("");
		setModalLoading(true);
		setLockConfirm({ open: false, reason: "" });

		try {
			const detail = await usersService.getUserDetail(user.id);
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

	// ── Lock/Unlock user ────────────────────────────────────────────────────

	/** Called when user clicks "Lock account" — opens confirm step */
	const handleInitiateLock = () => {
		setLockConfirm({ open: true, reason: "" });
		setModalError("");
	};

	/** Confirm unlock (no dialog needed, no reason required by spec) */
	const handleUnlock = async () => {
		if (!selectedUser) return;
		setStatusUpdating(true);
		setModalError("");
		try {
			await usersService.updateUserStatus(selectedUser.id, true);
			setSelectedUser((prev) => (prev ? { ...prev, isActive: true } : prev));
			setUsers((prev) =>
				prev.map((u) =>
					u.id === selectedUser.id ? { ...u, isActive: true } : u,
				),
			);
		} catch (error: unknown) {
			setModalError(
				getErrorMessage(error, "Failed to unlock account. Please try again."),
			);
		} finally {
			setStatusUpdating(false);
		}
	};

	/** Confirm lock with optional reason */
	const handleConfirmLock = async () => {
		if (!selectedUser) return;
		setStatusUpdating(true);
		setModalError("");
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
			setLockConfirm({ open: false, reason: "" });
		} catch (error: unknown) {
			setModalError(
				getErrorMessage(error, "Failed to lock account. Please try again."),
			);
		} finally {
			setStatusUpdating(false);
		}
	};

	const handleCancelLock = () => {
		setLockConfirm({ open: false, reason: "" });
	};

	// ─────────────────────────────────────────────────────────────────────────

	const pageNumbers =
		pagination ? buildPageNumbers(page, pagination.totalPages) : [];

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
				<input
					type="search"
					className="users-page__search"
					placeholder="Search by email, username, or name..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<select
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
				<table className="users-table">
					<thead>
						<tr>
							<th>User</th>
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
									{Array.from({ length: 6 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : users.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="users-table__empty">
									<div className="empty-state">
										<span className="empty-state__icon">
											👤
										</span>
										<span className="empty-state__title">
											No users found
										</span>
										<span className="empty-state__desc">
											Try adjusting your filters or
											search query
										</span>
									</div>
								</td>
							</tr>
						) : (
							users.map((user) => (
								<tr
									key={user.id}
									onClick={() => handleOpenUserDetails(user)}>
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
											<div className="user-cell__tooltip" role="tooltip">
												<span className="user-cell__tooltip-row">
													<span className="user-cell__tooltip-label">Username</span>
													<span>@{user.username}</span>
												</span>
												<span className="user-cell__tooltip-row">
													<span className="user-cell__tooltip-label">Email</span>
													<span>{user.email}</span>
												</span>
											</div>
										</div>
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
											? formatRelativeTime(user.lastLoginAt)
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

			{pagination && pagination.totalPages > 1 && (
				<div className="users-pagination">
					<button
						className="users-pagination__btn"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						aria-label="Previous page">
						←
					</button>

					{pageNumbers.map((p, idx) =>
						p === "..." ? (
							<span
								key={`ellipsis-${idx}`}
								className="users-pagination__ellipsis">
								…
							</span>
						) : (
							<button
								key={p}
								className={cn(
									"users-pagination__btn",
									p === page &&
										"users-pagination__btn--active",
								)}
								onClick={() => setPage(p)}>
								{p}
							</button>
						),
					)}

					<button
						className="users-pagination__btn"
						disabled={page >= pagination.totalPages}
						onClick={() => setPage((p) => p + 1)}
						aria-label="Next page">
						→
					</button>

					<span className="users-pagination__info">
						{pagination.total.toLocaleString()} users
					</span>
				</div>
			)}

			{/* ── User Detail Modal ─────────────────────────────────────────── */}
			{selectedUser && (
				<div
					className="users-modal-overlay"
					onClick={() => setSelectedUser(null)}>
					<div
						className="users-modal"
						onClick={(e) => e.stopPropagation()}>
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

							{/* Emotion Distribution — placeholder */}
							<div className="users-modal__section-title">
								Emotion Distribution
							</div>
							<div className="emotion-dist">
								<p className="emotion-dist__empty">
									Emotion distribution data will appear here
									once available from the API.
								</p>
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
								/* ── Lock flow ──────────────────────────── */
								lockConfirm.open ? (
									<div className="users-modal__lock-confirm">
										<p className="users-modal__lock-confirm-title">
											🔒 Confirm account lock
										</p>
										<p className="users-modal__lock-confirm-desc">
											This will immediately revoke all active
											sessions for{" "}
											<strong>{selectedUser.name}</strong>.
										</p>
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
										<div className="users-modal__lock-confirm-actions">
											<button
												type="button"
												className="users-modal__action-btn users-modal__action-btn--cancel"
												onClick={handleCancelLock}
												disabled={statusUpdating}>
												Cancel
											</button>
											<button
												type="button"
												className="users-modal__action-btn users-modal__action-btn--lock"
												onClick={handleConfirmLock}
												disabled={statusUpdating}>
												{statusUpdating
													? "Locking..."
													: "🔒 Confirm lock"}
											</button>
										</div>
									</div>
								) : (
									<button
										type="button"
										className="users-modal__action-btn users-modal__action-btn--lock"
										onClick={handleInitiateLock}
										disabled={statusUpdating}>
										🔒 Lock account
									</button>
								)
							) : (
								/* ── Unlock flow (no confirm needed) ─────── */
								<button
									type="button"
									className="users-modal__action-btn users-modal__action-btn--unlock"
									onClick={handleUnlock}
									disabled={statusUpdating}>
									{statusUpdating
										? "Unlocking..."
										: "🔓 Unlock account"}
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
