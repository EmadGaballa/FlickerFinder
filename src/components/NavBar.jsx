import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { searchMovies } from "../services/api";
import "../css/NavBar.css";

const DEBOUNCE_MS = 400;

function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isMovieDetailPage = location.pathname.startsWith("/movie/");

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => setMenuOpen(false), [location]);

    // Search functionality
    useEffect(() => {
        if (!searchQuery.trim()) {
            setIsSearching(false);
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setIsSearching(true);
        setSearchLoading(true);
        setShowSearchDropdown(true);

        const timer = setTimeout(async () => {
            try {
                const results = await searchMovies(searchQuery);
                setSearchResults(results.slice(0, 5)); // Show top 5 results
            } catch (err) {
                console.error(err);
                setSearchResults([]);
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
        setShowSearchDropdown(false);
    };

    const handleSearchResultClick = (movieId) => {
        navigate(`/movie/${movieId}`);
        handleClearSearch();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}${menuOpen ? " navbar--open" : ""}`}>
            <Link to="/" className="navbar-logo">
                <span className="logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="3" fill="currentColor"/>
                        <circle cx="12" cy="5"  r="1.5" fill="currentColor"/>
                        <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                        <circle cx="5"  cy="12" r="1.5" fill="currentColor"/>
                        <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
                        <circle cx="7.4" cy="7.4"   r="1.5" fill="currentColor"/>
                        <circle cx="16.6" cy="16.6" r="1.5" fill="currentColor"/>
                        <circle cx="16.6" cy="7.4"  r="1.5" fill="currentColor"/>
                        <circle cx="7.4"  cy="16.6" r="1.5" fill="currentColor"/>
                    </svg>
                </span>
                <span className="logo-text">
                    Flick<em>Finder</em>
                </span>
            </Link>

            {/* SEARCH BAR - Only visible on MovieDetail page */}
            {isMovieDetailPage && (
                <div className="navbar-search-wrapper">
                    <form onSubmit={(e) => e.preventDefault()} className="navbar-search-form">
                        <div className="navbar-search-inner">
                            <svg
                                className="navbar-search-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>

                            <input
                                type="text"
                                placeholder="Find another movie..."
                                className="navbar-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoComplete="off"
                            />

                            {searchLoading && <div className="navbar-search-spinner" />}

                            {searchQuery && !searchLoading && (
                                <button
                                    type="button"
                                    className="navbar-search-clear"
                                    onClick={handleClearSearch}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Search Dropdown Results */}
                        {showSearchDropdown && searchResults.length > 0 && (
                            <div className="navbar-search-dropdown">
                                {searchResults.map((movie) => (
                                    <div
                                        key={movie.id}
                                        className="navbar-search-result"
                                        onClick={() => handleSearchResultClick(movie.id)}
                                    >
                                        <div className="navbar-result-poster">
                                            {movie.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                                    alt={movie.title}
                                                />
                                            ) : (
                                                <div className="navbar-result-placeholder">🎬</div>
                                            )}
                                        </div>
                                        <div className="navbar-result-info">
                                            <h4 className="navbar-result-title">{movie.title}</h4>
                                            <p className="navbar-result-year">
                                                {movie.release_date?.slice(0, 4)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showSearchDropdown && searchQuery && searchResults.length === 0 && !searchLoading && (
                            <div className="navbar-search-empty">
                                No movies found
                            </div>
                        )}
                    </form>
                </div>
            )}

            <div className="navbar-links">
                <Link
                    to="/"
                    className={`nav-link${isActive("/") ? " nav-link--active" : ""}`}
                >
                    Discover
                </Link>
                <Link
                    to="/favorites"
                    className={`nav-link${isActive("/favorites") ? " nav-link--active" : ""}`}
                >
                    <svg viewBox="0 0 24 24" fill={isActive("/favorites") ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="nav-link-icon">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    Favorites
                </Link>
            </div>

            <button
                className={`nav-hamburger${menuOpen ? " nav-hamburger--open" : ""}`}
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Toggle menu"
            >
                <span /><span /><span />
            </button>

            <div className={`nav-drawer${menuOpen ? " nav-drawer--open" : ""}`}>
                <Link to="/" className={`drawer-link${isActive("/") ? " drawer-link--active" : ""}`}>
                    Discover
                </Link>
                <Link to="/favorites" className={`drawer-link${isActive("/favorites") ? " drawer-link--active" : ""}`}>
                    Favorites
                </Link>
            </div>

            {menuOpen && (
                <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
            )}
        </nav>
    );
}

export default NavBar;
