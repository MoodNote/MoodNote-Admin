import { useEffect, useRef, useState } from "react";
import { usersService } from "@/services";
import type { AdminUser } from "@/types/user";
import { getInitials } from "@/utils/string";
import { getErrorMessage } from "@/utils/error";
import "./UserMultiSelect.css";

interface UserMultiSelectProps {
	value: AdminUser[];
	onChange: (users: AdminUser[]) => void;
	/** Maximum number of users selectable */
	max?: number;
	/** id for the search input (accessibility / label association) */
	inputId?: string;
}

export default function UserMultiSelect({
	value,
	onChange,
	max = 500,
	inputId,
}: UserMultiSelectProps) {
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const atMax = value.length >= max;

	// ── Close dropdown when clicking outside ──────────────────────────────
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// ── Debounced search ──────────────────────────────────────────────────
	const runSearch = (term: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (!term.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		debounceRef.current = setTimeout(async () => {
			try {
				const data = await usersService.getUsers({
					page: 1,
					limit: 8,
					search: term.trim(),
					isActive: "true",
				});
				setResults(data.users);
				setError("");
			} catch (err: unknown) {
				setError(getErrorMessage(err, "Failed to search users."));
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 300);
	};

	const handleSearchChange = (term: string) => {
		setSearch(term);
		setOpen(true);
		runSearch(term);
	};

	const handleAdd = (user: AdminUser) => {
		if (atMax) return;
		if (value.some((u) => u.id === user.id)) return;
		onChange([...value, user]);
	};

	const handleRemove = (userId: string) => {
		onChange(value.filter((u) => u.id !== userId));
	};

	const selectedIds = new Set(value.map((u) => u.id));
	const visibleResults = results.filter((u) => !selectedIds.has(u.id));

	return (
		<div className="user-select" ref={containerRef}>
			{/* Selected chips */}
			{value.length > 0 && (
				<div className="user-select__chips">
					{value.map((user) => (
						<span key={user.id} className="user-select__chip">
							<span
								className="user-select__chip-avatar"
								aria-hidden="true">
								{getInitials(user.name)}
							</span>
							<span className="user-select__chip-name">
								{user.name}
							</span>
							<button
								type="button"
								className="user-select__chip-remove"
								onClick={() => handleRemove(user.id)}
								aria-label={`Remove ${user.name}`}>
								✕
							</button>
						</span>
					))}
				</div>
			)}

			{/* Search input + dropdown */}
			<div className="user-select__field">
				<input
					id={inputId}
					type="text"
					className="user-select__input"
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
					onFocus={() => search.trim() && setOpen(true)}
					placeholder={
						atMax
							? `Reached limit of ${max} users`
							: "Search by name, email, or username..."
					}
					disabled={atMax}
					autoComplete="off"
				/>

				{open && search.trim() && (
					<div className="user-select__dropdown">
						{loading ? (
							<div className="user-select__status">
								Searching...
							</div>
						) : error ? (
							<div className="user-select__status user-select__status--error">
								{error}
							</div>
						) : visibleResults.length === 0 ? (
							<div className="user-select__status">
								No matching users
							</div>
						) : (
							visibleResults.map((user) => (
								<button
									key={user.id}
									type="button"
									className="user-select__option"
									onClick={() => handleAdd(user)}>
									<span
										className="user-select__option-avatar"
										aria-hidden="true">
										{getInitials(user.name)}
									</span>
									<span className="user-select__option-info">
										<span className="user-select__option-name">
											{user.name}
										</span>
										<span className="user-select__option-meta">
											@{user.username} · {user.email}
										</span>
									</span>
								</button>
							))
						)}
					</div>
				)}
			</div>

			<div className="user-select__counter">
				{value.length} / {max} selected
			</div>
		</div>
	);
}
