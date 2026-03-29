import api from "./api";
import type {
	ArtistDetailResponse,
	ArtistsResponse,
	GenreDetailResponse,
	GenresResponse,
	TrackDetailResponse,
	TracksResponse,
	UpsertTrackPayload,
} from "@/types/music";
import type { MusicStatsResponse } from "@/types/stats";
import { withErrorHandling } from "@/utils/error";

interface PaginatedQuery {
	page: number;
	limit: number;
	search?: string;
}

interface TracksQuery extends PaginatedQuery {
	genreId?: string;
}

class MusicService {
	getStats = withErrorHandling(async () => {
		const { data } =
			await api.get<MusicStatsResponse>("/admin/music/stats");
		return data.data.stats;
	});

	getGenres = withErrorHandling(async (params: PaginatedQuery) => {
		const { data } = await api.get<GenresResponse>("/admin/music/genres", {
			params,
		});
		return data.data;
	});

	getGenreDetail = withErrorHandling(async (genreId: string) => {
		const { data } = await api.get<GenreDetailResponse>(
			`/admin/music/genres/${genreId}`,
		);
		return data.data.genre;
	});

	createGenre = withErrorHandling(async (name: string) => {
		await api.post("/admin/music/genres", { name });
	});

	updateGenre = withErrorHandling(async (genreId: string, name: string) => {
		await api.put(`/admin/music/genres/${genreId}`, { name });
	});

	deleteGenre = withErrorHandling(async (genreId: string) => {
		await api.delete(`/admin/music/genres/${genreId}`);
	});

	getArtists = withErrorHandling(async (params: PaginatedQuery) => {
		const { data } = await api.get<ArtistsResponse>(
			"/admin/music/artists",
			{
				params,
			},
		);
		return data.data;
	});

	getArtistDetail = withErrorHandling(async (artistId: string) => {
		const { data } = await api.get<ArtistDetailResponse>(
			`/admin/music/artists/${artistId}`,
		);
		return data.data.artist;
	});

	createArtist = withErrorHandling(async (name: string) => {
		await api.post("/admin/music/artists", { name });
	});

	updateArtist = withErrorHandling(async (artistId: string, name: string) => {
		await api.put(`/admin/music/artists/${artistId}`, { name });
	});

	deleteArtist = withErrorHandling(async (artistId: string) => {
		await api.delete(`/admin/music/artists/${artistId}`);
	});

	getTracks = withErrorHandling(async (params: TracksQuery) => {
		const { data } = await api.get<TracksResponse>("/admin/music/tracks", {
			params,
		});
		return data.data;
	});

	getTrackDetail = withErrorHandling(async (trackId: string) => {
		const { data } = await api.get<TrackDetailResponse>(
			`/admin/music/tracks/${trackId}`,
		);
		return data.data.track;
	});

	createTrack = withErrorHandling(async (payload: UpsertTrackPayload) => {
		await api.post("/admin/music/tracks", payload);
	});

	updateTrack = withErrorHandling(
		async (trackId: string, payload: UpsertTrackPayload) => {
			await api.patch(`/admin/music/tracks/${trackId}`, payload);
		},
	);

	deleteTrack = withErrorHandling(async (trackId: string) => {
		await api.delete(`/admin/music/tracks/${trackId}`);
	});
}

export const musicService = new MusicService();
