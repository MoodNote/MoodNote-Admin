import { useEffect, useRef, useState } from "react";
import { musicService } from "@/services";
import type { Artist } from "@/types/music";
import { getErrorMessage } from "@/utils/error";
import { getInitials } from "@/utils/string";
import "./ArtistMultiSelect.css";

interface ArtistMultiSelectProps {
	value: Artist[];
	onChange: (artists: Artist[]) => void;
	inputId?: string;
}

export default function ArtistMultiSelect({
	value,
	onChange,
	inputId,
}: ArtistMultiSelectProps) {
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<Artist[]>([]);
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
				const data = await musicService.getArtists({
					page: 1,
					limit: 8,
					search: term.trim(),
				});
				setResults(data.artists);
				setError("");
			} catch (err: unknown) {
				setError(getErrorMessage(err, "Failed to search artists."));
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

	const handleAdd = (artist: Artist) => {
		if (value.some((item) => item.id === artist.id)) return;
		onChange([...value, artist]);
		setSearch("");
		setResults([]);
		setOpen(false);
	};

	const handleRemove = (artistId: string) => {
		onChange(value.filter((artist) => artist.id !== artistId));
	};

	const selectedIds = new Set(value.map((artist) => artist.id));
	const visibleResults = results.filter((artist) => !selectedIds.has(artist.id));

	return (
		<div className="artist-select" ref={containerRef}>
			{value.length > 0 && (
				<div className="artist-select__chips">
					{value.map((artist) => (
						<span key={artist.id} className="artist-select__chip">
							<span
								className="artist-select__chip-avatar"
								aria-hidden="true">
								{getInitials(artist.name)}
							</span>
							<span className="artist-select__chip-name">
								{artist.name}
							</span>
							<button
								type="button"
								className="artist-select__chip-remove"
								onClick={() => handleRemove(artist.id)}
								aria-label={`Remove ${artist.name}`}>
								x
							</button>
						</span>
					))}
				</div>
			)}

			<div className="artist-select__field">
				<input
					id={inputId}
					type="text"
					className="artist-select__input"
					value={search}
					onChange={(e) => handleSearchChange(e.target.value)}
					onFocus={() => search.trim() && setOpen(true)}
					placeholder="Search artists by name..."
					autoComplete="off"
				/>

				{open && search.trim() && (
					<div className="artist-select__dropdown">
						{loading ? (
							<div className="artist-select__status">
								Searching...
							</div>
						) : error ? (
							<div className="artist-select__status artist-select__status--error">
								{error}
							</div>
						) : visibleResults.length === 0 ? (
							<div className="artist-select__status">
								No matching artists
							</div>
						) : (
							visibleResults.map((artist) => (
								<button
									key={artist.id}
									type="button"
									className="artist-select__option"
									onClick={() => handleAdd(artist)}>
									<span
										className="artist-select__option-avatar"
										aria-hidden="true">
										{getInitials(artist.name)}
									</span>
									<span className="artist-select__option-info">
										<span className="artist-select__option-name">
											{artist.name}
										</span>
										{artist.trackCount !== undefined && (
											<span className="artist-select__option-meta">
												{artist.trackCount} tracks
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
