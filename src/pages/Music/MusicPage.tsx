import { useEffect, useState } from "react";
import { musicService } from "@/services";
import type { MusicCatalogStats } from "@/types/stats";
import GenresTab from "./GenresTab";
import ArtistsTab from "./ArtistsTab";
import TracksTab from "./TracksTab";
import "./MusicPage.css";

type Tab = "genres" | "artists" | "tracks";

const TABS: { id: Tab; label: string }[] = [
	{ id: "genres", label: "Genres" },
	{ id: "artists", label: "Artists" },
	{ id: "tracks", label: "Tracks" },
];

export default function MusicPage() {
	const [tab, setTab] = useState<Tab>("genres");
	const [stats, setStats] = useState<MusicCatalogStats | null>(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [statsError, setStatsError] = useState("");

	useEffect(() => {
		const fetchStats = async () => {
			setStatsLoading(true);
			setStatsError("");
			try {
				const data = await musicService.getStats();
				setStats(data);
			} catch {
				setStatsError("Failed to load music stats.");
			} finally {
				setStatsLoading(false);
			}
		};

		void fetchStats();
	}, []);

	return (
		<div className="music-page">
			<div className="music-page__header">
				<h2 className="music-page__title">Music</h2>
				<p className="music-page__subtitle">
					Manage genres, artists and tracks
				</p>
			</div>

			{statsError && <p className="music-page__error">{statsError}</p>}

			<div className="music-page__stats">
				<div className="music-mini-stat">
					<span className="music-mini-stat__label">Tracks</span>
					<strong className="music-mini-stat__value">
						{statsLoading ? "..." : (stats?.totals.tracks ?? "—")}
					</strong>
				</div>
				<div className="music-mini-stat">
					<span className="music-mini-stat__label">Artists</span>
					<strong className="music-mini-stat__value">
						{statsLoading ? "..." : (stats?.totals.artists ?? "—")}
					</strong>
				</div>
				<div className="music-mini-stat">
					<span className="music-mini-stat__label">Genres</span>
					<strong className="music-mini-stat__value">
						{statsLoading ? "..." : (stats?.totals.genres ?? "—")}
					</strong>
				</div>
			</div>

			<div className="music-page__top-genres">
				<span className="music-page__top-genres-label">
					Top genres:
				</span>
				{statsLoading ? (
					<span className="music-page__top-genres-empty">
						Loading...
					</span>
				) : (stats?.topGenres.length ?? 0) === 0 ? (
					<span className="music-page__top-genres-empty">
						No data
					</span>
				) : (
					stats?.topGenres.slice(0, 6).map((genre) => (
						<span
							key={genre.genreId}
							className="music-page__top-genre-pill">
							{genre.name} ({genre.trackCount})
						</span>
					))
				)}
			</div>

			<div className="music-tabs">
				{TABS.map((t) => (
					<button
						key={t.id}
						className={`music-tab${tab === t.id ? " music-tab--active" : ""}`}
						onClick={() => setTab(t.id)}>
						{t.label}
					</button>
				))}
			</div>

			{tab === "genres" && <GenresTab />}
			{tab === "artists" && <ArtistsTab />}
			{tab === "tracks" && <TracksTab />}
		</div>
	);
}
