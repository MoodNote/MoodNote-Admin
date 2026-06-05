import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { moodTagsService } from "@/services";
import type { MoodTag, MoodTagType, MoodTagsQueryParams } from "@/types/moodTag";
import type { Pagination as PaginationType } from "@/types/user";
import { formatDate } from "@/utils/format";
import { getErrorMessage } from "@/utils/error";
import { notifySuccess, notifyError } from "@/utils/toast";
import { cn } from "@/utils/cn";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import Pagination from "@/components/Pagination";
import ColorPicker from "@/components/ColorPicker";
import "./MoodTagsPage.css";

type TypeFilter = "" | MoodTagType;

interface ModalState {
	open: boolean;
	item: MoodTag | null;
}

interface TagForm {
	name: string;
	color: string;
	type: MoodTagType;
}

const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const TAG_TYPE_OPTIONS: MoodTagType[] = ["MOOD", "LIFE"];

export default function MoodTagsPage() {
	const [tags, setTags] = useState<MoodTag[]>([]);
	const [pagination, setPagination] = useState<PaginationType | null>(null);
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [modal, setModal] = useState<ModalState>({ open: false, item: null });
	const [form, setForm] = useState<TagForm>({ name: "", color: "", type: "MOOD" });
	const [formError, setFormError] = useState("");
	const [formLoading, setFormLoading] = useState(false);

	const [deleteTarget, setDeleteTarget] = useState<MoodTag | null>(null);
	const [deleting, setDeleting] = useState(false);

	const fetchTags = async (
		currentPage: number,
		currentSearch: string,
		currentType: TypeFilter,
	) => {
		setLoading(true);
		setError("");
		try {
			const params: MoodTagsQueryParams = {
				page: currentPage,
				limit: 20,
				search: currentSearch || undefined,
				type: currentType || undefined,
			};
			const data = await moodTagsService.getMoodTags(params);
			setTags(data.tags);
			setPagination(data.pagination);
		} catch (err: unknown) {
			setError(getErrorMessage(err, "Failed to load mood tags."));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTags(page, search, typeFilter);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, typeFilter]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setPage(1);
			fetchTags(1, value, typeFilter);
		}, 300);
	};

	const handleTypeFilterChange = (value: TypeFilter) => {
		setTypeFilter(value);
		setPage(1);
	};

	const openAdd = () => {
		setForm({ name: "", color: "", type: "MOOD" });
		setFormError("");
		setModal({ open: true, item: null });
	};

	const openEdit = (item: MoodTag) => {
		setForm({
			name: item.name,
			color: item.color ?? "",
			type: item.type,
		});
		setFormError("");
		setModal({ open: true, item });
	};

	const closeModal = () => setModal({ open: false, item: null });

	const validateForm = (): string => {
		if (!form.name.trim()) return "Name is required.";
		if (form.name.trim().length > 50) return "Name must be 50 characters or fewer.";
		if (form.color && !COLOR_REGEX.test(form.color))
			return "Color must be a hex code like #6B7280.";
		return "";
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const validationError = validateForm();
		if (validationError) {
			setFormError(validationError);
			return;
		}

		setFormLoading(true);
		const isEdit = modal.item !== null;

		try {
			if (modal.item) {
				await moodTagsService.updateMoodTag(modal.item.id, {
					name: form.name.trim(),
					color: form.color || null,
					type: form.type,
				});
			} else {
				await moodTagsService.createMoodTag({
					name: form.name.trim(),
					color: form.color || undefined,
					type: form.type,
				});
			}
			closeModal();
			notifySuccess(isEdit ? "Tag updated." : "Tag created.");
			fetchTags(page, search, typeFilter);
		} catch (err: unknown) {
			setFormError(getErrorMessage(err, "Failed to save. Please try again."));
		} finally {
			setFormLoading(false);
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteTarget) return;
		setDeleting(true);
		try {
			await moodTagsService.deleteMoodTag(deleteTarget.id);
			notifySuccess(`Deleted "${deleteTarget.name}".`);
			setDeleteTarget(null);
			fetchTags(page, search, typeFilter);
		} catch (err: unknown) {
			notifyError(err, `Failed to delete "${deleteTarget.name}".`);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<div className="mood-tags-page">
			<div className="mood-tags-page__header">
				<div>
					<h2 className="mood-tags-page__title">Mood Tags</h2>
					<p className="mood-tags-page__subtitle">
						{pagination
							? `${pagination.total.toLocaleString()} total tags`
							: "Manage mood and life tags"}
					</p>
				</div>
			</div>

			<div className="mood-tags-page__toolbar">
				<label htmlFor="tag-search" className="sr-only">
					Search tags
				</label>
				<input
					id="tag-search"
					type="search"
					className="music-section__search"
					placeholder="Search by name..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<label htmlFor="tag-type-filter" className="sr-only">
					Filter by type
				</label>
				<select
					id="tag-type-filter"
					className="music-section__filter"
					value={typeFilter}
					onChange={(e) =>
						handleTypeFilterChange(e.target.value as TypeFilter)
					}>
					<option value="">All types</option>
					<option value="MOOD">MOOD</option>
					<option value="LIFE">LIFE</option>
				</select>
				<button
					type="button"
					className="music-section__add-btn"
					onClick={openAdd}>
					+ Add tag
				</button>
			</div>

			{error && <p className="music-section__error">{error}</p>}

			<div className="music-table-wrapper">
				<table className="music-table" aria-busy={loading}>
					<thead>
						<tr>
							<th className="mood-col--name">Name</th>
							<th className="mood-col--color">Color</th>
							<th className="mood-col--type">Type</th>
							<th className="mood-col--created">Created</th>
							<th className="music-col--actions" />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 8 }).map((_, i) => (
								<tr key={i} className="music-table__skeleton-row">
									{Array.from({ length: 5 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : tags.length === 0 ? (
							<tr>
								<td colSpan={5} className="music-table__empty">
									No tags found.
								</td>
							</tr>
						) : (
							tags.map((tag) => (
								<tr key={tag.id}>
									<td className="mood-col--name">
										<span className="mood-tag__name">
											{tag.name}
										</span>
									</td>
									<td className="mood-col--color">
										{tag.color ? (
											<div className="mood-color-cell">
												<span
													className="mood-color-swatch"
													style={{
														backgroundColor: tag.color,
													}}
												/>
												<span className="mood-color-hex">
													{tag.color}
												</span>
											</div>
										) : (
											<span className="mood-color-none">—</span>
										)}
									</td>
									<td className="mood-col--type">
										<span
											className={cn(
												"mood-type-badge",
												tag.type === "MOOD"
													? "mood-type-badge--mood"
													: "mood-type-badge--life",
											)}>
											{tag.type}
										</span>
									</td>
									<td className="mood-col--created music-table__date">
										{formatDate(tag.createdAt)}
									</td>
									<td className="music-col--actions">
										<div className="music-table__actions">
											<button
												type="button"
												className="action-btn action-btn--edit"
												title="Edit"
												aria-label={`Edit ${tag.name}`}
												onClick={() => openEdit(tag)}>
												✏️
											</button>
											<button
												type="button"
												className="action-btn action-btn--delete"
												title="Delete"
												aria-label={`Delete ${tag.name}`}
												onClick={() => setDeleteTarget(tag)}>
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
					itemLabel="tags"
					onPageChange={setPage}
				/>
			)}

			{/* Add / Edit modal */}
			<Modal
				open={modal.open}
				onOpenChange={(o) => {
					if (!o) closeModal();
				}}
				title={modal.item ? "Edit tag" : "Add tag"}
				titleClassName="music-modal__title"
				contentClassName="music-modal mood-tag-modal">
				<form onSubmit={handleSubmit} noValidate>
					{formError && (
						<p className="music-modal__error">{formError}</p>
					)}

					<div className="music-modal__group">
						<label className="music-modal__label" htmlFor="tag-name">
							Name *
						</label>
						<input
							id="tag-name"
							className="music-modal__input"
							maxLength={50}
							value={form.name}
							onChange={(e) =>
								setForm((f) => ({ ...f, name: e.target.value }))
							}
							placeholder="e.g. vui vẻ, buồn bã..."
							autoFocus
						/>
					</div>

					<div className="music-modal__group">
						<label
							className="music-modal__label"
							htmlFor="tag-color">
							Color{" "}
							<span className="music-modal__optional">
								(optional)
							</span>
						</label>
						<ColorPicker
							value={form.color}
							onChange={(c) =>
								setForm((f) => ({ ...f, color: c }))
							}
						/>
					</div>

					<div className="music-modal__group">
						<span className="music-modal__label" id="tag-type-label">
							Type *
						</span>
						<div
							className="mood-tag-type-toggle"
							role="radiogroup"
							aria-labelledby="tag-type-label">
							{TAG_TYPE_OPTIONS.map((type) => {
								const isSelected = form.type === type;
								return (
									<button
										key={type}
										type="button"
										role="radio"
										aria-checked={isSelected}
										className={cn(
											"mood-tag-type-toggle__option",
											isSelected &&
												"mood-tag-type-toggle__option--active",
										)}
										onClick={() =>
											setForm((f) => ({ ...f, type }))
										}>
										{type}
									</button>
								);
							})}
						</div>
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
									: "Add tag"}
						</button>
					</div>
				</form>
			</Modal>

			{/* Delete confirm */}
			<ConfirmDialog
				open={deleteTarget !== null}
				onOpenChange={(o) => {
					if (!o) setDeleteTarget(null);
				}}
				title="Delete tag"
				description={
					deleteTarget ? (
						<>
							Delete{" "}
							<strong>&ldquo;{deleteTarget.name}&rdquo;</strong>?
							This cannot be undone.
						</>
					) : undefined
				}
				confirmLabel="Delete"
				variant="danger"
				loading={deleting}
				onConfirm={handleConfirmDelete}
			/>
		</div>
	);
}
