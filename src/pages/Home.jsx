import MovieCard from "../components/MovieCard";
import "../css/Home.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { searchMovies, getPopularMovies } from "../services/api";

const TMDB_IMG = "https://image.tmdb.org/t/p/";
const DEBOUNCE_MS = 400;

function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [movies, setMovies] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    const [heroPosterUrls, setHeroPosterUrls] = useState([]);

    const [topTen, setTopTen] = useState([]);

    const [popularMovies, setPopularMovies] = useState([]);
    const [popularPage, setPopularPage] = useState(1);
    const [popularLoading, setPopularLoading] = useState(false);
    const [hasMorePopular, setHasMorePopular] = useState(true);
    const loaderRef = useRef(null);

    useEffect(() => {
        const init = async () => {
            try {
                const [page1, page2] = await Promise.all([
                    getPopularMovies(1),
                    getPopularMovies(2),
                ]);

                const all = [...page1, ...page2];

                const withBackdrop = all
                    .filter((m) => m.backdrop_path)
                    .slice(0, 18)
                    .map((m) => `${TMDB_IMG}w780${m.backdrop_path}`);
                setHeroPosterUrls(withBackdrop);

                setTopTen(page1.slice(0, 10));

                setPopularMovies(all);
            } catch (err) {
                console.error(err);
                setError("Failed to load movies…");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    const loadMorePopular = useCallback(async () => {
        if (popularLoading || !hasMorePopular || isSearching) return;
        setPopularLoading(true);
        try {
            const nextPage = popularPage + 1;
            const newMovies = await getPopularMovies(nextPage);
            if (!newMovies || newMovies.length === 0) {
                setHasMorePopular(false);
            } else {
                setPopularMovies((prev) => {
                    const ids = new Set(prev.map((m) => m.id));
                    return [...prev, ...newMovies.filter((m) => !ids.has(m.id))];
                });
                setPopularPage(nextPage);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setPopularLoading(false);
        }
    }, [popularLoading, hasMorePopular, popularPage, isSearching]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMorePopular();
            },
            { threshold: 0.1 }
        );
        const el = loaderRef.current;
        if (el) observer.observe(el);
        return () => { if (el) observer.unobserve(el); };
    }, [loadMorePopular]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setMovies([]);
            setError(null);
            return;
        }

        setIsSearching(true);
        setSearchLoading(true);

        const timer = setTimeout(async () => {
            try {
                const results = await searchMovies(searchQuery);
                setMovies(results);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Search failed…");
            } finally {
                setSearchLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearching(false);
        setMovies([]);
        setError(null);
    };

    const getRatingColor = (rating) => {
        if (rating >= 8) return "#f5c518";
        if (rating >= 6.5) return "#e8a838";
        return "#e05c34";
    };

    return (
        <div className="home">

            <section className="hero">
                <div className="hero-mosaic" aria-hidden="true">
                    {heroPosterUrls.map((url, i) => (
                        <div
                            key={i}
                            className="mosaic-cell"
                            style={{
                                backgroundImage: `url(${url})`,
                                animationDelay: `${(i * 0.4) % 6}s`,
                            }}
                        />
                    ))}
                    <div className="mosaic-overlay" />
                </div>

                <div className="hero-content">
                    <p className="hero-eyebrow">All The World's Movies</p>
                    <h1 className="hero-headline">
                        Find Your <em>Favorite</em><br />Movie Now
                    </h1>

                    <form onSubmit={(e) => e.preventDefault()} className="search-form">
                        <div className="search-inner">
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Discover movies and TV shows..."
                                className="search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoComplete="off"
                            />
                            {searchLoading && <div className="search-spinner" />}
                            {searchQuery && !searchLoading && (
                                <button
                                    type="button"
                                    className="search-clear"
                                    onClick={handleClearSearch}
                                    aria-label="Clear search"
                                >✕</button>
                            )}
                        </div>
                    </form>
                </div>
            </section>

            {isSearching && (
                <section className="results-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            Results for <em>"{searchQuery}"</em>
                        </h2>
                        <button className="back-btn" onClick={handleClearSearch}>
                            ← Back
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {searchLoading ? (
                        <div className="loading-grid">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="skeleton-card" />
                            ))}
                        </div>
                    ) : movies.length === 0 ? (
                        <div className="no-results">
                            <span>🎬</span>
                            We couldn’t find anything matching your search.😟
                        </div>
                    ) : (
                        <div className="movies-grid">
                            {movies.map((movie) => (
                                <MovieCard movie={movie} key={movie.id} />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {!isSearching && (
                <section className="popular-section">
                    <div className="section-header">
                        <div className="section-label">🌍 Popular</div>
                        <h2 className="section-title">Popular Movies Right Now</h2>
                    </div>

                    {loading ? (
                        <div className="loading-grid">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="skeleton-card" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="movies-grid">
                                {popularMovies.map((movie) => (
                                    <MovieCard movie={movie} key={movie.id} />
                                ))}
                            </div>

                        </>
                    )}
                </section>
            )}

            {!isSearching && !loading && topTen.length > 0 && (
                <section className="top10-section">
                    <div className="section-header">
                        <div className="section-label">🔥 Trending</div>
                        <h2 className="section-title">Top 10 Right Now</h2>
                    </div>

                    <div className="top10-list">
                        {topTen.map((movie, idx) => (
                            <div className="top10-card" key={movie.id}>
                                <div className="rank-number">{idx + 1}</div>

                                <div className="top10-poster">
                                    {movie.poster_path ? (
                                        <img
                                            src={`${TMDB_IMG}w342${movie.poster_path}`}
                                            alt={movie.title}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="poster-placeholder">🎬</div>
                                    )}
                                </div>

                                <div className="top10-info">
                                    <h3 className="top10-title">{movie.title}</h3>
                                    <div className="top10-meta">
                                        <span
                                            className="top10-rating"
                                            style={{ color: getRatingColor(movie.vote_average) }}
                                        >
                                            ★ {movie.vote_average?.toFixed(1)}
                                        </span>
                                        <span className="top10-year">
                                            {movie.release_date?.slice(0, 4)}
                                        </span>
                                    </div>
                                    <p className="top10-overview">
                                        {movie.overview?.slice(0, 120)}
                                        {movie.overview?.length > 120 ? "…" : ""}
                                    </p>
                                </div>

                                <div
                                    className="rank-badge"
                                    style={{
                                        background:
                                            idx === 0
                                                ? "linear-gradient(135deg,#f5c518,#e8a838)"
                                                : idx === 1
                                                    ? "linear-gradient(135deg,#c0c0c0,#a8a8a8)"
                                                    : idx === 2
                                                        ? "linear-gradient(135deg,#cd7f32,#a0522d)"
                                                        : "rgba(255,255,255,0.12)",
                                    }}
                                >
                                    #{idx + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
}

export default Home;