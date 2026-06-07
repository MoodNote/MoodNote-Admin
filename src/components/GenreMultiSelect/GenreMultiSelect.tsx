import { useEffect, useRef, useState } from "react";
import { musicService } from "@/services";
import type { Genre } from "@/types/music";
import { getErrorMessage } from "@/utils/error";
import { getInitials } from "@/utils/string";
import "./GenreMultiSelect.css";

interface GenreMultiSelectProps {
	value: Genre[];
	onChange: (genres: Genre[]) => void;
	inputId?: string;
}

export default function GenreMultiSelect({
	value,
	onChange,
	inputId,
}: GenreMultiSelectProps) {
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<Genre[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);

	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, []);

	const runSearch = (term: string) => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (!term.trim()) {
			setResults([]);
			setLoading(false);
			setError("");
			return;
		}

		setLoading(true);
		debounceRef.current = setTimeout(async () => {
			try {
				const data = await musicService.getGenres({
					page: 1,
					limit: 8,
					search: term.trim(),
				});
				setResults(data.genres);
				setError("");
			} catch (err: unknown) {
				setError(getErrorMessage(err, "Failed to search genres."));
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

	const handleAdd = (genre: Genre) => {
		if (value.some((item) => item.id === genre.id)) return;
		onChange([...value, genre]);
		setSearch("");
		setResults([]);
		setOpen(false);
	};

	const handleRemove = (genreId: string) => {
		onChange(value.filter((genre) => genre.id !== genreId));
	};

	const selectedIds = new Set(value.map((genre) => genre.id));
	const visibleResults = results.filter((genre) => !selectedIds.has(genre.id));

	return (
		<div className="genre-select" ref={containerRef}>
			{value.length > 0 && (
				<div className="genre-select__chips">
					{value.map((genre) => (
						<span key={genre.id} className="genre-select__chip">
							<span
								className="genre-select__chip-avatar"
								aria-hidden="true">
								{getInitials(genre.name)}
							</span>
							<span className="genre-select__chip-name">
								{genre.name}
							</span>
							<button
								type="button"
								className="genre-select__chip-remove"
								onClick={() => handleRemove(genre.id)}
								aria-label={`Remove ${genre.name}`}>
								x
							</button>
						</span>
					))}
				</div>
			)}

			<div className="genre-select__field">
				<input
					id={inputId}
					type="text"
					className="genre-select__input"
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
					onFocus={() => search.trim() && setOpen(true)}
					placeholder="Search genres by name..."
					autoComplete="off"
				/>

				{open && search.trim() && (
					<div className="genre-select__dropdown">
						{loading ? (
							<div className="genre-select__status">
								Searching...
							</div>
						) : error ? (
							<div className="genre-select__status genre-select__status--error">
								{error}
							</div>
						) : visibleResults.length === 0 ? (
							<div className="genre-select__status">
								No matching genres
							</div>
						) : (
							visibleResults.map((genre) => (
								<button
									key={genre.id}
									type="button"
									className="genre-select__option"
									onClick={() => handleAdd(genre)}>
									<span
										className="genre-select__option-avatar"
										aria-hidden="true">
										{getInitials(genre.name)}
									</span>
									<span className="genre-select__option-info">
										<span className="genre-select__option-name">
											{genre.name}
										</span>
										{genre.trackCount !== undefined && (
											<span className="genre-select__option-meta">
												{genre.trackCount} tracks
											</span>
										)}
									</span>
								</button>
							))
						)}
					</div>
				)}
			</div>
		</div>
	);
}
