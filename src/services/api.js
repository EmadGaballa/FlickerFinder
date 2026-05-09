const API_KEY = "04d7dc9285c072825117f7cc3c3936fc";
const BASE_URL = "https://api.themoviedb.org/3";

export const getPopularMovies = async (page = 1) => {
    const response = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results;
};

export const searchMovies = async (query) => {
    const response = await fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results;
};

export const getMovieDetails = async (id) => {
    const [details, credits, videos] = await Promise.all([
        fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`).then((r) => r.json()),
        fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`).then((r) => r.json()),
        fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`).then((r) => r.json()),
    ]);

    return {
        ...details,
        cast: credits.cast?.slice(0, 12) ?? [],
        trailer: videos.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
        ) ?? null,
    };
};

export const getGenres = async () => {
    const response = await fetch(
        `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.genres; // [{ id, name }, ...]
};

// Main discover function — used for filtered + infinite scroll browsing
// filters: { genreId, sortBy, minRating, yearFrom, yearTo }
export const discoverMovies = async (page = 1, filters = {}) => {
    const params = new URLSearchParams({
        api_key: API_KEY,
        page,
        sort_by: filters.sortBy || "popularity.desc",
        include_adult: false,
        include_video: false,
    });

    if (filters.genreId)   params.set("with_genres",           filters.genreId);
    if (filters.minRating) params.set("vote_average.gte",      filters.minRating);
    if (filters.yearFrom)  params.set("primary_release_date.gte", `${filters.yearFrom}-01-01`);
    if (filters.yearTo)    params.set("primary_release_date.lte", `${filters.yearTo}-12-31`);

    const response = await fetch(`${BASE_URL}/discover/movie?${params}`);
    const data = await response.json();
    return {
        results: data.results ?? [],
        totalPages: data.total_pages ?? 1,
    };
};