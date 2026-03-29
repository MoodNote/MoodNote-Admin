import { useState, useEffect, useRef } from "react";
import { usersService } from "@/services";
import type { AdminUser, Pagination } from "@/types/user";
import { formatDate, formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import { getErrorMessage } from "@/utils/error";
import "./UsersPage.css";

type ActiveFilter = "" | "true" | "false";

export default function UsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [search, setSearch] = useState("");
	const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
	const [createdFrom, setCreatedFrom] = useState("");
	const [createdTo, setCreatedTo] = useState("");
	const [entryMin, setEntryMin] = useState("");
	const [entryMax, setEntryMax] = useState("");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchUsers = async (
		currentPage: number,
		currentSearch: string,
		currentFilter: ActiveFilter,
		currentCreatedFrom: string,
		currentCreatedTo: string,
		currentEntryMin: string,
		currentEntryMax: string,
	) => {
		setLoading(true);
		setError("");
		try {
			const data = await usersService.getUsers({
				page: currentPage,
				limit: 20,
				search: currentSearch || undefined,
				isActive: currentFilter || undefined,
				createdFrom: currentCreatedFrom || undefined,
				createdTo: currentCreatedTo || undefined,
				entryCountMin: currentEntryMin || undefined,
				entryCountMax: currentEntryMax || undefined,
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
		fetchUsers(
			page,
			search,
			activeFilter,
			createdFrom,
			createdTo,
			entryMin,
			entryMax,
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, activeFilter, createdFrom, createdTo, entryMin, entryMax]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setPage(1);
			fetchUsers(
				1,
				value,
				activeFilter,
				createdFrom,
				createdTo,
				entryMin,
				entryMax,
			);
		}, 300);
	};

	const handleFilterChange = (value: ActiveFilter) => {
		setActiveFilter(value);
		setPage(1);
	};

	const handleCreatedFromChange = (value: string) => {
		setCreatedFrom(value);
		setPage(1);
	};

	const handleCreatedToChange = (value: string) => {
		setCreatedTo(value);
		setPage(1);
	};

	const handleEntryMinChange = (value: string) => {
		setEntryMin(value);
		setPage(1);
	};

	const handleEntryMaxChange = (value: string) => {
		setEntryMax(value);
		setPage(1);
	};

	const clearAdvancedFilters = () => {
		setCreatedFrom("");
		setCreatedTo("");
		setEntryMin("");
		setEntryMax("");
		setPage(1);
	};

	return (
		<div className="users-page">
			<div className="users-page__header">
				<h2 className="users-page__title">Users</h2>
				<p className="users-page__subtitle">
					{pagination
						? `${pagination.total} total users`
						: "Manage all users"}
				</p>
			</div>

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

				<input
					type="date"
					className="users-page__filter users-page__date"
					value={createdFrom}
					onChange={(e) => handleCreatedFromChange(e.target.value)}
					aria-label="Created from date"
				/>

				<input
					type="date"
					className="users-page__filter users-page__date"
					value={createdTo}
					onChange={(e) => handleCreatedToChange(e.target.value)}
					aria-label="Created to date"
				/>

				<input
					type="number"
					min={0}
					className="users-page__filter users-page__number"
					value={entryMin}
					onChange={(e) => handleEntryMinChange(e.target.value)}
					placeholder="Min entries"
				/>

				<input
					type="number"
					min={0}
					className="users-page__filter users-page__number"
					value={entryMax}
					onChange={(e) => handleEntryMaxChange(e.target.value)}
					placeholder="Max entries"
				/>

				<button
					type="button"
					className="users-page__clear-filters"
					onClick={clearAdvancedFilters}>
					Clear filters
				</button>
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
							<th>Entries</th>
							<th>Last Login</th>
							<th>Joined</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr
									key={i}
									className="users-table__skeleton-row">
									{Array.from({ length: 8 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : users.length === 0 ? (
							<tr>
								<td
									colSpan={8}
									className="users-table__empty">
									No users found.
								</td>
							</tr>
						) : (
							users.map((user) => (
								<tr key={user.id}>
									<td>
										<div className="user-cell">
											<span className="user-cell__name">
												{user.name}
											</span>
											<span className="user-cell__meta">
												@{user.username} · {user.email}
											</span>
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
												? "Active"
												: "Inactive"}
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
												? "Verified"
												: "Unverified"}
										</span>
									</td>
									<td className="users-table__num">
										{user.entryCount}
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
									<td>
										<button
											type="button"
											className="users-table__details-btn"
											onClick={() =>
												setSelectedUser(user)
											}>
											Details
										</button>
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
						onClick={() => setPage((p) => p - 1)}>
						Previous
					</button>
					<span className="users-pagination__info">
						Page {pagination.page} of {pagination.totalPages} (
						{pagination.total} total)
					</span>
					<button
						className="users-pagination__btn"
						disabled={page >= pagination.totalPages}
						onClick={() => setPage((p) => p + 1)}>
						Next
					</button>
				</div>
			)}

			{selectedUser && (
				<div
					className="users-modal-overlay"
					onClick={() => setSelectedUser(null)}>
					<div
						className="users-modal"
						onClick={(e) => e.stopPropagation()}>
						<div className="users-modal__header">
							<h3 className="users-modal__title">User details</h3>
							<button
								type="button"
								className="users-modal__close"
								onClick={() => setSelectedUser(null)}
								aria-label="Close details">
								✕
							</button>
						</div>

						<div className="users-modal__content">
							<div className="users-modal__row">
								<span>Email</span>
								<strong>{selectedUser.email}</strong>
							</div>
							<div className="users-modal__row">
								<span>Username</span>
								<strong>@{selectedUser.username}</strong>
							</div>
							<div className="users-modal__row">
								<span>Name</span>
								<strong>{selectedUser.name}</strong>
							</div>
							<div className="users-modal__row">
								<span>Role</span>
								<strong>{selectedUser.role}</strong>
							</div>
							<div className="users-modal__row">
								<span>Status</span>
								<strong>
									{selectedUser.isActive
										? "Active"
										: "Inactive"}
								</strong>
							</div>
							<div className="users-modal__row">
								<span>Email verified</span>
								<strong>
									{selectedUser.isEmailVerified
										? "Yes"
										: "No"}
								</strong>
							</div>
							<div className="users-modal__row">
								<span>Total entries</span>
								<strong>{selectedUser.entryCount}</strong>
							</div>
							<div className="users-modal__row">
								<span>Joined</span>
								<strong>
									{formatDate(selectedUser.createdAt)}
								</strong>
							</div>
							<div className="users-modal__row">
								<span>Last login</span>
								<strong>
									{selectedUser.lastLoginAt
										? formatRelativeTime(
												selectedUser.lastLoginAt,
											)
										: "—"}
								</strong>
							</div>
						</div>

						<p className="users-modal__note">
							Emotion distribution and lock/unlock actions depend
							on additional backend endpoints not exposed in
							current API specs.
						</p>

						<div className="users-modal__actions">
							<button
								type="button"
								className="users-modal__action-btn"
								disabled>
								{selectedUser.isActive
									? "Lock account (pending API)"
									: "Unlock account (pending API)"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
