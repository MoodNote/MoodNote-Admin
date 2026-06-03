import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { musicService } from "@/services";
import type { Genre } from "@/types/music";
import type { Pagination as PaginationType } from "@/types/user";
import { getErrorMessage } from "@/utils/error";
import { notifySuccess, notifyError } from "@/utils/toast";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";


interface ModalState {
	open: boolean;
	item: Genre | null;
}


export default function GenresTab() {
	const [genres, setGenres] = useState<Genre[]>([]);
	const [pagination, setPagination] = useState<PaginationType | null>(null);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [modal, setModal] = useState<ModalState>({ open: false, item: null });
	const [formName, setFormName] = useState("");
	const [formError, setFormError] = useState("");
	const [formLoading, setFormLoading] = useState(false);

	// Delete confirmation
	const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
	const [deleting, setDeleting] = useState(false);

	const fetchGenres = async (currentPage: number, currentSearch: string) => {
		setLoading(true);
		setError("");
		try {
			const data = await musicService.getGenres({
				page: currentPage,
				limit: 20,
				search: currentSearch || undefined,
			});
			setGenres(data.genres);
			setPagination(data.pagination);
		} catch (error: unknown) {
			setError(getErrorMessage(error, "Failed to load genres."));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGenres(page, search);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setPage(1);
			fetchGenres(1, value);
		}, 300);
	};

	const openAdd = () => {
		setFormName("");
		setFormError("");
		setModal({ open: true, item: null });
	};

	const openEdit = async (item: Genre) => {
		setFormName(item.name);
		setFormError("");
		setModal({ open: true, item });

		try {
			const genre = await musicService.getGenreDetail(item.id);
			setFormName(genre.name);
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

		if (formName.trim().length > 100) {
			setFormError("Name must be 100 characters or fewer.");
			return;
		}

		setFormLoading(true);
		const name = formName.trim();
		const isEdit = modal.item !== null;

		try {
			if (modal.item) {
				await musicService.updateGenre(modal.item.id, name);
			} else {
				await musicService.createGenre(name);
			}
			closeModal();
			notifySuccess(isEdit ? "Genre updated." : "Genre created.");
			fetchGenres(page, search);
		} catch (error: unknown) {
			setFormError(
				getErrorMessage(error, "Failed to save. Please try again."),
			);
		} finally {
			setFormLoading(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await musicService.deleteGenre(deleteTarget.id);
			notifySuccess(`Deleted "${deleteTarget.name}".`);
			setDeleteTarget(null);
			fetchGenres(page, search);
		} catch (error: unknown) {
			notifyError(error, `Failed to delete "${deleteTarget.name}".`);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div>
			<div className="music-section__toolbar">
				<label htmlFor="genre-search" className="sr-only">
					Search genres
				</label>
				<input
					id="genre-search"
					type="search"
					className="music-section__search"
					placeholder="Search genres..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<button
					className="music-section__add-btn"
					onClick={openAdd}>
					+ Add genre
				</button>
			</div>

			{error && <p className="music-section__error">{error}</p>}

			<div className="music-table-wrapper">
				<table className="music-table" aria-busy={loading}>
					<thead>
						<tr>
							<th className="music-col--genre-name">Name</th>
							<th className="music-col--genre-tracks">Tracks</th>
							<th className="music-col--actions" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 8 }).map((_, i) => (
								<tr
									key={i}
									className="music-table__skeleton-row">
									{Array.from({ length: 3 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : genres.length === 0 ? (
							<tr>
								<td
									colSpan={3}
									className="music-table__empty">
									No genres found.
								</td>
							</tr>
						) : (
							genres.map((g) => (
								<tr key={g.id}>
									<td className="music-col--genre-name">
										<span style={{ fontWeight: 600, color: "var(--color-text)" }}>
											{g.name}
										</span>
									</td>
									<td className="music-col--genre-tracks music-table__num">
										{g.trackCount ?? 0}
									</td>
									<td className="music-col--actions">
										<div className="music-table__actions">
											<button
												className="action-btn action-btn--edit"
												title="Edit"
												aria-label={`Edit ${g.name}`}
												onClick={() => openEdit(g)}>
												✏️
											</button>
											<button
												className="action-btn action-btn--delete"
												title="Delete"
												aria-label={`Delete ${g.name}`}
												onClick={() => setDeleteTarget(g)}>
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

			{pagination && (
				<Pagination
					page={page}
					totalPages={pagination.totalPages}
					total={pagination.total}
					itemLabel="genres"
					onPageChange={setPage}
				/>
			)}

			<Modal
				open={modal.open}
				onOpenChange={(o) => {
					if (!o) closeModal();
				}}
				title={modal.item ? "Edit genre" : "Add genre"}
				titleClassName="music-modal__title"
				contentClassName="music-modal">
				<form onSubmit={handleSubmit} noValidate>
					{formError && (
						<p className="music-modal__error">{formError}</p>
					)}
					<div className="music-modal__group">
						<label
							className="music-modal__label"
							htmlFor="genre-name">
							Name *
						</label>
						<input
							id="genre-name"
							className="music-modal__input"
							maxLength={100}
							value={formName}
							onChange={(e) => setFormName(e.target.value)}
							placeholder="e.g. Pop, Rock..."
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
							{formLoading && (
								<span className="spinner" aria-hidden="true" />
							)}
							{formLoading
								? "Saving..."
								: modal.item
									? "Save changes"
									: "Add genre"}
						</button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(o) => {
					if (!o) setDeleteTarget(null);
				}}
				title="Delete genre"
				description={
					deleteTarget
						? `Delete "${deleteTarget.name}"? This cannot be undone.`
						: undefined
				}
				confirmLabel="Delete"
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}
