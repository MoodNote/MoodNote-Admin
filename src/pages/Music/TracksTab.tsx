import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { musicService } from "@/services";
import type { Artist, Genre, Track, UpsertTrackPayload } from "@/types/music";
import type { Pagination } from "@/types/user";
import { formatDate } from "@/utils/format";
import { getErrorMessage } from "@/utils/error";
import { cn } from "@/utils/cn";


interface ModalState {
	open: boolean;
	item: Track | null;
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


interface TrackForm {
	trackName: string;
	albumName: string;
	popularity: string;
	isExplicit: boolean;
	durationMs: string;
	danceability: string;
	energy: string;
	key: string;
	loudness: string;
	speechiness: string;
	acousticness: string;
	instrumentalness: string;
	liveness: string;
	valence: string;
	tempo: string;
	lyrics: string;
	artistIds: string[];
	genreIds: string[];
}

const EMPTY_FORM: TrackForm = {
	trackName: "",
	albumName: "",
	popularity: "",
	isExplicit: false,
	durationMs: "",
	danceability: "",
	energy: "",
	key: "",
	loudness: "",
	speechiness: "",
	acousticness: "",
	instrumentalness: "",
	liveness: "",
	valence: "",
	tempo: "",
	lyrics: "",
	artistIds: [],
	genreIds: [],
};

function formatDurationMs(durationMs: number | null): string {
	if (durationMs === null) return "—";
	const totalSeconds = Math.floor(durationMs / 1000);
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}

function parseOptionalInteger(value: string): number | undefined {
	if (value.trim() === "") return undefined;
	return Number.parseInt(value, 10);
}

function parseOptionalFloat(value: string): number | undefined {
	if (value.trim() === "") return undefined;
	return Number.parseFloat(value);
}

function mapTrackToForm(track: Track): TrackForm {
	return {
		trackName: track.trackName,
		albumName: track.albumName ?? "",
		popularity: track.popularity === null ? "" : String(track.popularity),
		isExplicit: track.isExplicit,
		durationMs: track.durationMs === null ? "" : String(track.durationMs),
		danceability:
			track.danceability === null ? "" : String(track.danceability),
		energy: track.energy === null ? "" : String(track.energy),
		key: track.key === null ? "" : String(track.key),
		loudness: track.loudness === null ? "" : String(track.loudness),
		speechiness:
			track.speechiness === null ? "" : String(track.speechiness),
		acousticness:
			track.acousticness === null ? "" : String(track.acousticness),
		instrumentalness:
			track.instrumentalness === null
				? ""
				: String(track.instrumentalness),
		liveness: track.liveness === null ? "" : String(track.liveness),
		valence: track.valence === null ? "" : String(track.valence),
		tempo: track.tempo === null ? "" : String(track.tempo),
		lyrics: track.lyrics ?? "",
		artistIds: track.artists.map((artist) => artist.id),
		genreIds: track.genres.map((genre) => genre.id),
	};
}

function validateRange(
	name: string,
	value: string,
	min: number,
	max: number,
): string | null {
	if (value.trim() === "") return null;
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed < min || parsed > max) {
		return `${name} must be between ${min} and ${max}.`;
	}
	return null;
}

function buildPayload(form: TrackForm): UpsertTrackPayload {
	const payload: UpsertTrackPayload = {
		trackName: form.trackName.trim(),
		isExplicit: form.isExplicit,
		artistIds: form.artistIds,
		genreIds: form.genreIds,
	};

	const albumName = form.albumName.trim();
	if (albumName) payload.albumName = albumName;

	const lyrics = form.lyrics.trim();
	if (lyrics) payload.lyrics = lyrics;

	const popularity = parseOptionalInteger(form.popularity);
	if (popularity !== undefined) payload.popularity = popularity;

	const durationMs = parseOptionalInteger(form.durationMs);
	if (durationMs !== undefined) payload.durationMs = durationMs;

	const musicalKey = parseOptionalInteger(form.key);
	if (musicalKey !== undefined) payload.key = musicalKey;

	const danceability = parseOptionalFloat(form.danceability);
	if (danceability !== undefined) payload.danceability = danceability;

	const energy = parseOptionalFloat(form.energy);
	if (energy !== undefined) payload.energy = energy;

	const loudness = parseOptionalFloat(form.loudness);
	if (loudness !== undefined) payload.loudness = loudness;

	const speechiness = parseOptionalFloat(form.speechiness);
	if (speechiness !== undefined) payload.speechiness = speechiness;

	const acousticness = parseOptionalFloat(form.acousticness);
	if (acousticness !== undefined) payload.acousticness = acousticness;

	const instrumentalness = parseOptionalFloat(form.instrumentalness);
	if (instrumentalness !== undefined)
		payload.instrumentalness = instrumentalness;

	const liveness = parseOptionalFloat(form.liveness);
	if (liveness !== undefined) payload.liveness = liveness;

	const valence = parseOptionalFloat(form.valence);
	if (valence !== undefined) payload.valence = valence;

	const tempo = parseOptionalFloat(form.tempo);
	if (tempo !== undefined) payload.tempo = tempo;

	return payload;
}

function getFormValidationError(form: TrackForm): string | null {
	if (!form.trackName.trim()) return "Track name is required.";
	if (form.trackName.trim().length > 300)
		return "Track name must be 300 characters or fewer.";
	if (form.albumName.trim().length > 300)
		return "Album name must be 300 characters or fewer.";
	if (form.artistIds.length === 0) return "At least one artist is required.";

	const popularity = parseOptionalInteger(form.popularity);
	if (
		popularity !== undefined &&
		(!Number.isInteger(popularity) || popularity < 0 || popularity > 100)
	) {
		return "Popularity must be an integer between 0 and 100.";
	}

	const durationMs = parseOptionalInteger(form.durationMs);
	if (
		durationMs !== undefined &&
		(!Number.isInteger(durationMs) || durationMs < 1)
	) {
		return "Duration must be an integer greater than or equal to 1 ms.";
	}

	const keyValue = parseOptionalInteger(form.key);
	if (
		keyValue !== undefined &&
		(!Number.isInteger(keyValue) || keyValue < 0 || keyValue > 11)
	) {
		return "Key must be an integer between 0 and 11.";
	}

	const rangedChecks = [
		validateRange("Danceability", form.danceability, 0, 1),
		validateRange("Energy", form.energy, 0, 1),
		validateRange("Speechiness", form.speechiness, 0, 1),
		validateRange("Acousticness", form.acousticness, 0, 1),
		validateRange("Instrumentalness", form.instrumentalness, 0, 1),
		validateRange("Liveness", form.liveness, 0, 1),
		validateRange("Valence", form.valence, 0, 1),
	];

	return rangedChecks.find((error) => error !== null) ?? null;
}

export default function TracksTab() {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);
	const [search, setSearch] = useState("");
	const [filterGenreId, setFilterGenreId] = useState("");
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// For dropdowns in filters & modal
	const [allGenres, setAllGenres] = useState<Genre[]>([]);
	const [allArtists, setAllArtists] = useState<Artist[]>([]);

	const [modal, setModal] = useState<ModalState>({ open: false, item: null });
	const [form, setForm] = useState<TrackForm>(EMPTY_FORM);
	const [formError, setFormError] = useState("");
	const [formLoading, setFormLoading] = useState(false);
	const [csvNotice, setCsvNotice] = useState("");

	const fetchTracks = async (
		currentPage: number,
		currentSearch: string,
		genreId: string,
	) => {
		setLoading(true);
		setError("");
		try {
			const data = await musicService.getTracks({
				page: currentPage,
				limit: 20,
				search: currentSearch || undefined,
				genreId: genreId || undefined,
			});
			setTracks(data.tracks);
			setPagination(data.pagination);
		} catch (error: unknown) {
			setError(getErrorMessage(error, "Failed to load tracks."));
		} finally {
			setLoading(false);
		}
	};

	const fetchDropdownData = async () => {
		try {
			const [genresResult, artistsResult] = await Promise.all([
				musicService.getGenres({ page: 1, limit: 100 }),
				musicService.getArtists({ page: 1, limit: 100 }),
			]);
			setAllGenres(genresResult.genres);
			setAllArtists(artistsResult.artists);
		} catch {
			// Non-critical; dropdowns simply won't populate
		}
	};

	useEffect(() => {
		fetchDropdownData();
	}, []);

	useEffect(() => {
		fetchTracks(page, search, filterGenreId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page, filterGenreId]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			setPage(1);
			fetchTracks(1, value, filterGenreId);
		}, 300);
	};

	const handleFilterChange = (value: string) => {
		setPage(1);
		setFilterGenreId(value);
	};

	const openAdd = () => {
		setForm(EMPTY_FORM);
		setFormError("");
		setModal({ open: true, item: null });
	};

	const openEdit = async (item: Track) => {
		setForm(mapTrackToForm(item));
		setFormError("");
		setModal({ open: true, item });

		try {
			const track = await musicService.getTrackDetail(item.id);
			setForm(mapTrackToForm(track));
		} catch {
			// Keep editable fallback from table row.
		}
	};

	const closeModal = () => setModal({ open: false, item: null });

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setFormError("");

		const validationError = getFormValidationError(form);
		if (validationError) {
			setFormError(validationError);
			return;
		}

		setFormLoading(true);

		const payload = buildPayload(form);

		try {
			if (modal.item) {
				await musicService.updateTrack(modal.item.id, payload);
			} else {
				await musicService.createTrack(payload);
			}

			closeModal();

			fetchTracks(page, search, filterGenreId);
		} catch (error: unknown) {
			setFormError(
				getErrorMessage(error, "Failed to save. Please try again."),
			);
		} finally {
			setFormLoading(false);
		}
	};

	const handleDelete = async (item: Track) => {
		if (
			!window.confirm(
				`Delete track "${item.trackName}"? This cannot be undone.`,
			)
		)
			return;
		try {
			await musicService.deleteTrack(item.id);
			fetchTracks(page, search, filterGenreId);
		} catch (error: unknown) {
			setError(
				getErrorMessage(error, `Failed to delete "${item.trackName}".`),
			);
		}
	};

	const handleMultiSelectChange = (
		e: ChangeEvent<HTMLSelectElement>,
		key: "artistIds" | "genreIds",
	) => {
		const values = Array.from(
			e.target.selectedOptions,
			(option) => option.value,
		);
		setForm((prev) => ({ ...prev, [key]: values }));
	};

	return (
		<div>
			<div className="music-section__toolbar">
				<input
					type="search"
					className="music-section__search"
					placeholder="Search tracks..."
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
				/>
				<select
					className="music-section__filter"
					value={filterGenreId}
					onChange={(e) => handleFilterChange(e.target.value)}>
					<option value="">All genres</option>
					{allGenres.map((g) => (
						<option
							key={g.id}
							value={g.id}>
							{g.name}
						</option>
					))}
				</select>

				<button
					className="music-section__add-btn"
					onClick={openAdd}>
					+ Add track
				</button>

				<button
					type="button"
					className="music-section__import-btn"
					onClick={() =>
						setCsvNotice(
							"CSV import UI is ready, but upload endpoint is not available in current API specs.",
						)
					}>
					Import CSV
				</button>
			</div>

			{error && <p className="music-section__error">{error}</p>}
			{csvNotice && <p className="music-section__notice">{csvNotice}</p>}

			<div className="music-table-wrapper">
				<table className="music-table">
					<thead>
						<tr>
							<th>Track</th>
							<th>Artists</th>
							<th>Genres</th>
							<th>Album</th>
							<th>Duration</th>
							<th>Popularity</th>
							<th>Explicit</th>
							<th>Created</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{loading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr
									key={i}
									className="music-table__skeleton-row">
									{Array.from({ length: 9 }).map((__, j) => (
										<td key={j}>
											<span className="skeleton" />
										</td>
									))}
								</tr>
							))
						) : tracks.length === 0 ? (
							<tr>
								<td
									colSpan={9}
									className="music-table__empty">
									No tracks found.
								</td>
							</tr>
						) : (
							tracks.map((t) => (
								<tr key={t.id}>
									<td>{t.trackName}</td>
									<td className="music-table__desc">
										{t.artists
											.map((artist) => artist.name)
											.join(", ") || "—"}
									</td>
									<td className="music-table__desc">
										{t.genres
											.map((genre) => genre.name)
											.join(", ") || "—"}
									</td>
									<td>{t.albumName ?? "—"}</td>
									<td className="music-table__date">
										{formatDurationMs(t.durationMs)}
									</td>
									<td className="music-table__num">
										{t.popularity ?? "—"}
									</td>
									<td>{t.isExplicit ? "Yes" : "No"}</td>
									<td className="music-table__date">
										{formatDate(t.createdAt)}
									</td>
									<td>
										<div className="music-table__actions">
											<button
												className="action-btn action-btn--edit"
												title="Edit"
												onClick={() => openEdit(t)}>
												✏️
											</button>
											<button
												className="action-btn action-btn--delete"
												title="Delete"
												onClick={() => handleDelete(t)}>
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
						{pagination.total.toLocaleString()} tracks
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
							{modal.item ? "Edit track" : "Add track"}
						</h3>

						<form
							onSubmit={handleSubmit}
							noValidate>
							{formError && (
								<p className="music-modal__error">
									{formError}
								</p>
							)}

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-name">
										Track name *
									</label>
									<input
										id="track-name"
										className="music-modal__input"
										maxLength={300}
										value={form.trackName}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												trackName: e.target.value,
											}))
										}
										placeholder="Track name..."
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-album">
										Album name
									</label>
									<input
										id="track-album"
										className="music-modal__input"
										maxLength={300}
										value={form.albumName}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												albumName: e.target.value,
											}))
										}
										placeholder="Album name..."
									/>
								</div>
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-popularity">
										Popularity (0-100)
									</label>
									<input
										id="track-popularity"
										type="number"
										min={0}
										max={100}
										className="music-modal__input"
										value={form.popularity}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												popularity: e.target.value,
											}))
										}
										placeholder="e.g. 85"
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-duration-ms">
										Duration (ms)
									</label>
									<input
										id="track-duration-ms"
										type="number"
										min={1}
										className="music-modal__input"
										value={form.durationMs}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												durationMs: e.target.value,
											}))
										}
										placeholder="e.g. 265000"
									/>
								</div>
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-artists">
										Artists * (hold Ctrl/Cmd for
										multi-select)
									</label>
									<select
										id="track-artists"
										multiple
										className="music-modal__select music-modal__select--multi"
										value={form.artistIds}
										onChange={(e) =>
											handleMultiSelectChange(
												e,
												"artistIds",
											)
										}>
										{allArtists.map((artist) => (
											<option
												key={artist.id}
												value={artist.id}>
												{artist.name}
											</option>
										))}
									</select>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-genres">
										Genres (hold Ctrl/Cmd for multi-select)
									</label>
									<select
										id="track-genres"
										multiple
										className="music-modal__select music-modal__select--multi"
										value={form.genreIds}
										onChange={(e) =>
											handleMultiSelectChange(
												e,
												"genreIds",
											)
										}>
										{allGenres.map((genre) => (
											<option
												key={genre.id}
												value={genre.id}>
												{genre.name}
											</option>
										))}
									</select>
								</div>
							</div>

							<div className="music-modal__group music-modal__group--checkbox">
								<label className="music-modal__label">
									<input
										type="checkbox"
										checked={form.isExplicit}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												isExplicit: e.target.checked,
											}))
										}
										className="music-modal__checkbox"
									/>
									Explicit content
								</label>
							</div>

							<div className="music-modal__section-title">
								Audio features
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-danceability">
										Danceability (0-1)
									</label>
									<input
										id="track-danceability"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.danceability}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												danceability: e.target.value,
											}))
										}
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-energy">
										Energy (0-1)
									</label>
									<input
										id="track-energy"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.energy}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												energy: e.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-key">
										Key (0-11)
									</label>
									<input
										id="track-key"
										type="number"
										min={0}
										max={11}
										className="music-modal__input"
										value={form.key}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												key: e.target.value,
											}))
										}
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-loudness">
										Loudness (dB)
									</label>
									<input
										id="track-loudness"
										type="number"
										step="0.1"
										className="music-modal__input"
										value={form.loudness}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												loudness: e.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-speechiness">
										Speechiness (0-1)
									</label>
									<input
										id="track-speechiness"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.speechiness}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												speechiness: e.target.value,
											}))
										}
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-acousticness">
										Acousticness (0-1)
									</label>
									<input
										id="track-acousticness"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.acousticness}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												acousticness: e.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-instrumentalness">
										Instrumentalness (0-1)
									</label>
									<input
										id="track-instrumentalness"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.instrumentalness}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												instrumentalness:
													e.target.value,
											}))
										}
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-liveness">
										Liveness (0-1)
									</label>
									<input
										id="track-liveness"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.liveness}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												liveness: e.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="music-modal__grid">
								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-valence">
										Valence (0-1)
									</label>
									<input
										id="track-valence"
										type="number"
										step="0.01"
										min={0}
										max={1}
										className="music-modal__input"
										value={form.valence}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												valence: e.target.value,
											}))
										}
									/>
								</div>

								<div className="music-modal__group">
									<label
										className="music-modal__label"
										htmlFor="track-tempo">
										Tempo (BPM)
									</label>
									<input
										id="track-tempo"
										type="number"
										step="0.1"
										className="music-modal__input"
										value={form.tempo}
										onChange={(e) =>
											setForm((f) => ({
												...f,
												tempo: e.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="music-modal__group">
								<label
									className="music-modal__label"
									htmlFor="track-lyrics">
									Lyrics
								</label>
								<textarea
									id="track-lyrics"
									className="music-modal__textarea"
									rows={4}
									value={form.lyrics}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											lyrics: e.target.value,
										}))
									}
									placeholder="Optional lyrics..."
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
											: "Add track"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
