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