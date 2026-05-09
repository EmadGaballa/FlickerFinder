import MovieCard from "../components/MovieCard";
import "../css/Home.css";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
    searchMovies,
    getPopularMovies,
    discoverMovies,
    getGenres,
} from "../services/api";

const TMDB_IMG = "https://image.tmdb.org/t/p/";
const DEBOUNCE_MS = 400;

const SORT_OPTIONS = [
    { value: "popularity.desc",           label: "Most Popular" },
    { value: "vote_average.desc",         label: "Highest Rated" },
    { value: "primary_release_date.desc", label: "Newest First" },
    { value: "primary_release_date.asc",  label: "Oldest First" },
    { value: "revenue.desc",              label: "Highest Revenue" },
];

const CURRENT_YEAR = new Date().getFullYear();

function Home() {
    const top10Ref  = useRef(null);   // ← attached to carousel div
    const searchRef = useRef(null);
    const location  = useLocation();

    useEffect(() => {
        if (location.state?.focusSearch) {
            searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            const input = searchRef.current?.querySelector("input");
            input?.focus();
        }
    }, [location]);

    const scrollLeft  = () => top10Ref.current?.scrollBy({ left: -320, behavior: "smooth" });
    const scrollRight = () => top10Ref.current?.scrollBy({ left:  320, behavior: "smooth" });

    // ── Search ────────────────────────────────────────────────────
    const [searchQuery,   setSearchQuery]   = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching,   setIsSearching]   = useState(false);

    // ── Hero / Top 10 ─────────────────────────────────────────────
    const [heroPosterUrls, setHeroPosterUrls] = useState([]);
    const [topTen,         setTopTen]         = useState([]);
    const [initLoading,    setInitLoading]    = useState(true);

    // ── Genres ────────────────────────────────────────────────────
    const [genres, setGenres] = useState([]);

    // ── Filters ───────────────────────────────────────────────────
    const [activeGenre, setActiveGenre] = useState(null);
    const [sortBy,      setSortBy]      = useState("popularity.desc");
    const [minRating,   setMinRating]   = useState(0);
    const [yearFrom,    setYearFrom]    = useState("");
    const [yearTo,      setYearTo]      = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // ── Grid / infinite scroll ────────────────────────────────────
    const [movies,        setMovies]        = useState([]);
    const [gridLoading,   setGridLoading]   = useState(false);
    const [isFetchingMore,setIsFetchingMore]= useState(false);
    const [hasMore,       setHasMore]       = useState(true);
    const [currentPage,   setCurrentPage]   = useState(1);
    const [totalPages,    setTotalPages]    = useState(1);
    const [error,         setError]         = useState(null);

    const loaderRef   = useRef(null);
    const filtersRef  = useRef({ sortBy: "popularity.desc", genreId: null, minRating: 0, yearFrom: "", yearTo: "" });

    const getRatingColor = (r) =>
        r >= 8 ? "#f5c518" : r >= 6.5 ? "#e8a838" : "#e05c34";

    const hasActiveFilters =
        activeGenre !== null || sortBy !== "popularity.desc" ||
        minRating > 0 || yearFrom !== "" || yearTo !== "";

    // ── Initial load ──────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const [page1, page2, genreList] = await Promise.all([
                    getPopularMovies(1),
                    getPopularMovies(2),
                    getGenres(),
                ]);
                const all = [...page1, ...page2];
                setHeroPosterUrls(
                    all.filter((m) => m.backdrop_path)
                       .slice(0, 18)
                       .map((m) => `${TMDB_IMG}w780${m.backdrop_path}`)
                );
                setTopTen(page1.slice(0, 10));
                setGenres(genreList);
            } catch (err) {
                console.error(err);
            } finally {
                setInitLoading(false);
            }
        };
        init();
    }, []);

    // ── Load movies ───────────────────────────────────────────────
    const loadMovies = useCallback(async (page, filters, append = false) => {
        if (!append) setGridLoading(true);
        else         setIsFetchingMore(true);
        setError(null);

        try {
            const { results, totalPages: tp } = await discoverMovies(page, filters);
            setMovies((prev) => {
                if (!append) return results;
                const ids = new Set(prev.map((m) => m.id));
                return [...prev, ...results.filter((m) => !ids.has(m.id))];
            });
            setCurrentPage(page);
            setTotalPages(tp);
            setHasMore(page < tp);
        } catch (err) {
            console.error(err);
            setError("Failed to load movies.");
        } finally {
            if (!append) setGridLoading(false);
            else         setIsFetchingMore(false);
        }
    }, []);

    // ── Infinite scroll observer ──────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !gridLoading && !isFetchingMore) {
                    loadMovies(currentPage + 1, filtersRef.current, true);
                }
            },
            { rootMargin: "300px" }
        );
        const el = loaderRef.current;
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, gridLoading, isFetchingMore, currentPage, loadMovies]);

    // ── Realtime filter changes ───────────────────────────────────
    useEffect(() => {
        const filters = {
            sortBy,
            genreId:   activeGenre,
            minRating: minRating || null,
            yearFrom:  yearFrom  || null,
            yearTo:    yearTo    || null,
        };
        filtersRef.current = filters;

        const timer = setTimeout(() => loadMovies(1, filters, false), 250);
        return () => clearTimeout(timer);
    }, [sortBy, activeGenre, minRating, yearFrom, yearTo, loadMovies]);

    const clearFilters = () => {
        setActiveGenre(null);
        setSortBy("popularity.desc");
        setMinRating(0);
        setYearFrom("");
        setYearTo("");
    };

    // ── Search ────────────────────────────────────────────────────
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        setSearchLoading(true);
        const timer = setTimeout(async () => {
            try {
                const results = await searchMovies(searchQuery);
                setSearchResults(results);
            } catch (err) {
                console.error(err);
            } finally {
                setSearchLoading(false);
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearching(false);
        setSearchResults([]);
    };

    // ─────────────────────────────────────────────────────────────
    return (
        <div className="home">

            {/* ── HERO ── */}
            <section className="hero">
                <div className="hero-mosaic" aria-hidden="true">
                    {heroPosterUrls.map((url, i) => (
                        <div key={i} className="mosaic-cell"
                            style={{ backgroundImage: `url(${url})`, animationDelay: `${(i * 0.4) % 6}s` }}
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
                        <div className="search-inner" ref={searchRef}>
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
                                <button type="button" className="search-clear" onClick={handleClearSearch}>✕</button>
                            )}
                        </div>
                    </form>
                </div>
            </section>

            {/* ── SEARCH RESULTS ── */}
            {isSearching && (
                <section className="results-section">
                    <div className="section-header">
                        <h2 className="section-title">Results for <em>"{searchQuery}"</em></h2>
                        <button className="back-btn" onClick={handleClearSearch}>← Back</button>
                    </div>
                    {searchLoading ? (
                        <div className="loading-grid">
                            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="no-results"><span>🎬</span> Nothing matched your search.</div>
                    ) : (
                        <div className="movies-grid">
                            {searchResults.map((m) => <MovieCard movie={m} key={m.id} />)}
                        </div>
                    )}
                </section>
            )}

            {/* ── TOP 10 ── */}
            {!isSearching && !initLoading && topTen.length > 0 && (
                <section className="top10-section">
                    <div className="top10-header section-header">
                        <div className="section-label">🔥 Trending</div>
                        <h2 className="section-title">Top 10 Right Now</h2>
                    </div>

                    <div className="top10-slider-wrapper">
                        <button className="top10-arrow top10-arrow-left" onClick={scrollLeft} aria-label="Scroll left">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 18l-6-6 6-6"/>
                            </svg>
                        </button>

                        {/* ↓ ref is HERE — this is what was missing */}
                        <div className="top10-carousel" ref={top10Ref}>
                            {topTen.map((movie, idx) => (
                                <Link to={`/movie/${movie.id}`} key={movie.id} className="top10-item">
                                    <div className="top10-card-wrapper">
                                        <div className="top10-rank">{idx + 1}</div>

                                        {movie.poster_path ? (
                                            <img
                                                src={`${TMDB_IMG}w342${movie.poster_path}`}
                                                alt={movie.title}
                                                loading="lazy"
                                                className="top10-poster-img"
                                            />
                                        ) : (
                                            <div className="top10-poster-placeholder">🎬</div>
                                        )}

                                        <div className="top10-hover-info">
                                            <h3 className="top10-card-title">{movie.title}</h3>
                                            <div className="top10-card-meta">
                                                <span className="top10-card-rating"
                                                    style={{ color: getRatingColor(movie.vote_average) }}>
                                                    ★ {movie.vote_average?.toFixed(1)}
                                                </span>
                                                <span className="top10-card-year">
                                                    {movie.release_date?.slice(0, 4)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        <button className="top10-arrow top10-arrow-right" onClick={scrollRight} aria-label="Scroll right">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </button>
                    </div>
                </section>
            )}

            {/* ── POPULAR / BROWSE ── */}
            {!isSearching && (
                <section className="popular-section">
                    <div className="section-header section-header--row">
                        <div>
                            <div className="section-label">🌍 Browse</div>
                            <h2 className="section-title">
                                {hasActiveFilters ? "Filtered Movies" : "Popular Movies Right Now"}
                            </h2>
                        </div>

                        <div className="filter-controls">
                            {hasActiveFilters && (
                                <button className="filter-clear-btn" onClick={clearFilters}>✕ Clear filters</button>
                            )}
                            <button
                                className={`filter-toggle-btn${filtersOpen ? " active" : ""}`}
                                onClick={() => setFiltersOpen((o) => !o)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="4" y1="6"  x2="20" y2="6" />
                                    <line x1="8" y1="12" x2="16" y2="12" />
                                    <line x1="11" y1="18" x2="13" y2="18" />
                                </svg>
                                Filters
                                {hasActiveFilters && <span className="filter-dot" />}
                            </button>
                        </div>
                    </div>

                    {/* Filter panel */}
                    <div className={`filter-panel${filtersOpen ? " filter-panel--open" : ""}`}>
                        <div className="filter-panel-inner">
                            <div className="filter-group">
                                <label className="filter-label">Sort By</label>
                                <div className="filter-pills">
                                    {SORT_OPTIONS.map((opt) => (
                                        <button key={opt.value}
                                            className={`filter-pill${sortBy === opt.value ? " active" : ""}`}
                                            onClick={() => setSortBy(opt.value)}
                                        >{opt.label}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Genre</label>
                                <div className="filter-pills">
                                    <button className={`filter-pill${activeGenre === null ? " active" : ""}`}
                                        onClick={() => setActiveGenre(null)}>All</button>
                                    {genres.map((g) => (
                                        <button key={g.id}
                                            className={`filter-pill${activeGenre === g.id ? " active" : ""}`}
                                            onClick={() => setActiveGenre(g.id)}
                                        >{g.name}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">
                                    Min Rating
                                    {minRating > 0 && <span className="filter-label-val">★ {minRating}+</span>}
                                </label>
                                <div className="filter-pills">
                                    {[0,5,6,6.5,7,7.5,8,8.5,9].map((v) => (
                                        <button key={v}
                                            className={`filter-pill rating-pill${minRating === v ? " active" : ""}`}
                                            onClick={() => setMinRating(v)}
                                        >{v === 0 ? "Any" : `${v}+`}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-label">Release Year</label>
                                <div className="year-range-row">
                                    <input type="number" className="year-input" placeholder="From"
                                        min="1900" max={CURRENT_YEAR} value={yearFrom}
                                        onChange={(e) => setYearFrom(e.target.value)} />
                                    <span className="year-sep">—</span>
                                    <input type="number" className="year-input" placeholder="To"
                                        min="1900" max={CURRENT_YEAR} value={yearTo}
                                        onChange={(e) => setYearTo(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active chips */}
                    {hasActiveFilters && !filtersOpen && (
                        <div className="active-chips">
                            {activeGenre && <span className="chip">{genres.find((g) => g.id === activeGenre)?.name}</span>}
                            {sortBy !== "popularity.desc" && <span className="chip">{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>}
                            {minRating > 0 && <span className="chip">★ {minRating}+</span>}
                            {yearFrom && <span className="chip">From {yearFrom}</span>}
                            {yearTo   && <span className="chip">To {yearTo}</span>}
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {gridLoading ? (
                        <div className="loading-grid">
                            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : movies.length === 0 ? (
                        <div className="no-results"><span>🎬</span> No movies match these filters.</div>
                    ) : (
                        <>
                            <div className="movies-grid">
                                {movies.map((m) => <MovieCard movie={m} key={m.id} />)}
                            </div>

                            <div ref={loaderRef} className="scroll-loader">
                                {isFetchingMore && (
                                    <div className="loader-dots"><span /><span /><span /></div>
                                )}
                                {!hasMore && movies.length > 0 && (
                                    <p className="end-msg">You've seen it all 🎬</p>
                                )}
                            </div>
                        </>
                    )}
                </section>
            )}

        </div>
    );
}

export default Home;