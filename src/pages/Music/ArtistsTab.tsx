import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { musicService } from "@/services";
import type { Artist } from "@/types/music";
import type { Pagination } from "@/types/user";
import { formatDate } from "@/utils/format";
import { getErrorMessage } from "@/utils/error";
import { cn } from "@/utils/cn";


interface ModalState {
	open: boolean;
	item: Artist | null;
}

function buildPageNumbers(
	currentPage: number,
	totalPages: number,
): (number | "...")[] {
	if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
	const pages: (number | "...")[] = [1];
	if (currentPage > 3) pages.push("...");
	for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
	if (currentPage < totalPages - 2) pages.push("...");
	pages.push(totalPages);
	return pages;
}


export default function ArtistsTab() {
	const [artists, setArtists] = useState<Artist[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [modal, setModal] = useState<ModalState>({ open: false, item: null });
	const [formName, setFormName] = useState("");
	const [formError, setFormError] = useState("");
	const [formLoading, setFormLoading] = useState(false);

	const fetchArtists = async (currentPage: number, currentSearch: string) => {
		setLoading(true);
		setError("");
		try {
			const data = await musicService.getArtists({
				page: currentPage,
				limit: 20,
				search: currentSearch || undefined,
			});
			setArtists(data.artists);
			setPagination(data.pagination);
		} catch (error: unknown) {
			setError(getErrorMessage(error, "Failed to load artists."));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchArtists(page, search);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setPage(1);
			fetchArtists(1, value);
		}, 300);
	};

	const openAdd = () => {
		setFormName("");
		setFormError("");
		setModal({ open: true, item: null });
	};

	const openEdit = async (item: Artist) => {
		setFormName(item.name);
		setFormError("");
		setModal({ open: true, item });

		try {
			const artist = await musicService.getArtistDetail(item.id);
			setFormName(artist.name);
		} catch {
			// Keep editable fallback from table row.
		}
	};

	const closeModal = () => setModal({ open: false, item: null });

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError("");
		if (!formName.trim()) {
			setFormError("Name is required.");
			return;
		}

		if (formName.trim().length > 200) {
			setFormError("Name must be 200 characters or fewer.");
			return;
		}

		setFormLoading(true);
		const name = formName.trim();

		try {
			if (modal.item) {
				await musicService.updateArtist(modal.item.id, name);
			} else {
				await musicService.createArtist(name);
			}
			closeModal();
			fetchArtists(page, search);
		} catch (error: unknown) {
			setFormError(
				getErrorMessage(error, "Failed to save. Please try again."),
			);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = async (item: Artist) => {
		if (
			!window.confirm(
				`Delete artist "${item.name}"? This cannot be undone.`,
			)
		)
			return;
		try {
			await musicService.deleteArtist(item.id);
			fetchArtists(page, search);
		} catch (error: unknown) {
			setError(
				getErrorMessage(error, `Failed to delete "${item.name}".`),
			);
		}
	};

	return (
		<div>
			<div className="music-section__toolbar">
				<input
					type="search"
					className="music-section__search"
					placeholder="Search artists..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<button
					className="music-section__add-btn"
					onClick={openAdd}>
					+ Add artist
				</button>
			</div>

			{error && <p className="music-section__error">{error}</p>}

			<div className="music-table-wrapper">
				<table className="music-table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Tracks</th>
							<th>Created</th>
							<th>Updated</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr
									key={i}
									className="music-table__skeleton-row">
									{Array.from({ length: 5 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : artists.length === 0 ? (
							<tr>
								<td
									colSpan={5}
									className="music-table__empty">
									No artists found.
								</td>
							</tr>
						) : (
							artists.map((a) => (
								<tr key={a.id}>
									<td>{a.name}</td>
									<td className="music-table__num">
										{a.trackCount ?? 0}
									</td>
									<td className="music-table__date">
										{a.createdAt
											? formatDate(a.createdAt)
											: "—"}
									</td>
									<td className="music-table__date">
										{a.updatedAt
											? formatDate(a.updatedAt)
											: "—"}
									</td>
									<td>
										<div className="music-table__actions">
											<button
												className="action-btn action-btn--edit"
												title="Edit"
												onClick={() => openEdit(a)}>
												✏️
											</button>
											<button
												className="action-btn action-btn--delete"
												title="Delete"
												onClick={() => handleDelete(a)}>
												🗑️
											</button>
										</div>
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{pagination && pagination.totalPages > 1 && (
				<div className="music-pagination">
					<button
						className="music-pagination__btn"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						aria-label="Previous page">
						←
					</button>
					{buildPageNumbers(page, pagination.totalPages).map((p, idx) =>
						p === "..." ? (
							<span key={`e-${idx}`} className="music-pagination__ellipsis">…</span>
						) : (
							<button
								key={p}
								className={cn("music-pagination__btn", p === page && "music-pagination__btn--active")}
								onClick={() => setPage(p)}>
								{p}
							</button>
						)
					)}
					<button
						className="music-pagination__btn"
						disabled={page >= pagination.totalPages}
						onClick={() => setPage((p) => p + 1)}
						aria-label="Next page">
						→
					</button>
					<span className="music-pagination__info">
						{pagination.total.toLocaleString()} artists
					</span>
				</div>
			)}

			{modal.open && (
				<div
					className="music-modal-overlay"
					onClick={closeModal}>
					<div
						className="music-modal"
						onClick={(e) => e.stopPropagation()}>
						<h3 className="music-modal__title">
							{modal.item ? "Edit artist" : "Add artist"}
						</h3>
						<form
							onSubmit={handleSubmit}
							noValidate>
							{formError && (
								<p className="music-modal__error">
									{formError}
								</p>
							)}
							<div className="music-modal__group">
								<label
									className="music-modal__label"
									htmlFor="artist-name">
									Name *
								</label>
								<input
									id="artist-name"
									className="music-modal__input"
									maxLength={200}
									value={formName}
									onChange={(e) =>
										setFormName(e.target.value)
									}
									placeholder="Artist name..."
								/>
							</div>
							<div className="music-modal__actions">
								<button
									type="button"
									className="music-modal__cancel"
									onClick={closeModal}>
									Cancel
								</button>
								<button
									type="submit"
									className="music-modal__submit"
									disabled={formLoading}>
									{formLoading
										? "Saving..."
										: modal.item
											? "Save changes"
											: "Add artist"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
