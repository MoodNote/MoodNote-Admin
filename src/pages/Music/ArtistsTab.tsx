import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { musicService } from "@/services";
import type { Artist } from "@/types/music";
import type { Pagination as PaginationType } from "@/types/user";
import { formatDate } from "@/utils/format";
import { getErrorMessage } from "@/utils/error";
import { notifySuccess, notifyError } from "@/utils/toast";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";


interface ModalState {
	open: boolean;
	item: Artist | null;
}


export default function ArtistsTab() {
	const [artists, setArtists] = useState<Artist[]>([]);
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
	const [deleteTarget, setDeleteTarget] = useState<Artist | null>(null);
	const [deleting, setDeleting] = useState(false);

	const fetchArtists = async (currentPage: number, currentSearch: string) => {
		setLoading(true);
		setError("");
		try {
			const data = await musicService.getArtists({
				page: currentPage,
				limit: 10,
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
		const isEdit = modal.item !== null;

		try {
			if (modal.item) {
				await musicService.updateArtist(modal.item.id, name);
			} else {
				await musicService.createArtist(name);
			}
			closeModal();
			notifySuccess(isEdit ? "Artist updated." : "Artist created.");
			fetchArtists(page, search);
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
			await musicService.deleteArtist(deleteTarget.id);
			notifySuccess(`Deleted "${deleteTarget.name}".`);
			setDeleteTarget(null);
			fetchArtists(page, search);
		} catch (error: unknown) {
			notifyError(error, `Failed to delete "${deleteTarget.name}".`);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<section
			className="music-section music-section--artists"
			aria-labelledby="music-artists-title">
			<div className="music-section__header">
				<h3
					id="music-artists-title"
					className="music-section__title">
					Artists
				</h3>
			</div>

			<div className="music-section__toolbar">
				<label htmlFor="artist-search" className="sr-only">
					Search artists
				</label>
				<input
					id="artist-search"
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
				<table className="music-table" aria-busy={loading}>
					<thead>
						<tr>
							<th className="music-col--artist-name">Name</th>
							<th className="music-col--artist-tracks">Tracks</th>
							<th className="music-col--artist-created">Created</th>
							<th className="music-col--artist-updated">Updated</th>
							<th className="music-col--actions" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 8 }).map((_, i) => (
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
									<td className="music-col--artist-name">
										<span style={{ fontWeight: 600, color: "var(--color-text)" }}>
											{a.name}
										</span>
									</td>
									<td className="music-col--artist-tracks music-table__num">
										{a.trackCount ?? 0}
									</td>
									<td className="music-col--artist-created music-table__date">
										{a.createdAt
											? formatDate(a.createdAt)
											: "—"}
									</td>
									<td className="music-col--artist-updated music-table__date">
										{a.updatedAt
											? formatDate(a.updatedAt)
											: "—"}
									</td>
									<td className="music-col--actions">
										<div className="music-table__actions">
											<button
												className="action-btn action-btn--edit"
												title="Edit"
												aria-label={`Edit ${a.name}`}
												onClick={() => openEdit(a)}>
												✏️
											</button>
											<button
												className="action-btn action-btn--delete"
												title="Delete"
												aria-label={`Delete ${a.name}`}
												onClick={() => setDeleteTarget(a)}>
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
					itemLabel="artists"
					onPageChange={setPage}
				/>
			)}

			<Modal
				open={modal.open}
				onOpenChange={(o) => {
					if (!o) closeModal();
				}}
				title={modal.item ? "Edit artist" : "Add artist"}
				titleClassName="music-modal__title"
				contentClassName="music-modal">
				<form onSubmit={handleSubmit} noValidate>
					{formError && (
						<p className="music-modal__error">{formError}</p>
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
							onChange={(e) => setFormName(e.target.value)}
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
							{formLoading && (
								<span className="spinner" aria-hidden="true" />
							)}
							{formLoading
								? "Saving..."
								: modal.item
									? "Save changes"
									: "Add artist"}
						</button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(o) => {
					if (!o) setDeleteTarget(null);
				}}
				title="Delete artist"
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
		</section>
	);
}
