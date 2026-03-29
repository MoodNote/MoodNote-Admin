import type { Pagination } from "./user";

export interface Genre {
	id: string;
	name: string;
	trackCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface Artist {
	id: string;
	name: string;
	trackCount?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface TrackRelation {
	id: string;
	name: string;
	role?: string | null;
}

export interface Track {
	id: string;
	trackName: string;
	albumName: string | null;
	popularity: number | null;
	isExplicit: boolean;
	durationMs: number | null;
	danceability: number | null;
	energy: number | null;
	key: number | null;
	loudness: number | null;
	speechiness: number | null;
	acousticness: number | null;
	instrumentalness: number | null;
	liveness: number | null;
	valence: number | null;
	tempo: number | null;
	lyrics: string | null;
	artists: TrackRelation[];
	genres: TrackRelation[];
	createdAt: string;
	updatedAt: string;
}

export interface GenresResponse {
	success: boolean;
	message: string;
	data: {
		genres: Genre[];
		pagination: Pagination;
	};
}

export interface ArtistsResponse {
	success: boolean;
	message: string;
	data: {
		artists: Artist[];
		pagination: Pagination;
	};
}

export interface TracksResponse {
	success: boolean;
	message: string;
	data: {
		tracks: Track[];
		pagination: Pagination;
	};
}

export interface TrackDetailResponse {
	success: boolean;
	message: string;
	data: {
		track: Track;
	};
}

export interface ArtistDetailResponse {
	success: boolean;
	message: string;
	data: {
		artist: Artist;
	};
}

export interface GenreDetailResponse {
	success: boolean;
	message: string;
	data: {
		genre: Genre;
	};
}

export interface UpsertTrackPayload {
	trackName?: string;
	albumName?: string;
	popularity?: number;
	isExplicit?: boolean;
	durationMs?: number;
	danceability?: number;
	energy?: number;
	key?: number;
	loudness?: number;
	speechiness?: number;
	acousticness?: number;
	instrumentalness?: number;
	liveness?: number;
	valence?: number;
	tempo?: number;
	lyrics?: string;
	artistIds?: string[];
	genreIds?: string[];
}
