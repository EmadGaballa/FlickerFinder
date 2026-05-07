import "../css/Favorites.css";
import { useMovieContext } from "../contexts/MovieContext";
import MovieCard from "../components/MovieCard";
import { Link } from "react-router-dom";

function Favorites() {
    const { favorites } = useMovieContext();
    const isEmpty = !favorites || favorites.length === 0;

    return (
        <div className="favorites-page">

            {/* ── Header ── */}
            <div className="favorites-header">
                <div className="favorites-header-inner">
                    <p className="favorites-eyebrow">Your Collection</p>
                    <h1 className="favorites-title">
                        Favorite <em>Films</em>
                    </h1>
                    {!isEmpty && (
                        <p className="favorites-count">
                            {favorites.length} {favorites.length === 1 ? "movie" : "movies"} in your list
                        </p>
                    )}
                </div>
            </div>

            {/* ── Empty state ── */}
            {isEmpty ? (
                <div className="favorites-empty">
                    <div className="empty-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </div>
                    <h2 className="empty-title">No Favorites Yet</h2>
                    <p className="empty-subtitle">
                        Movies you favorite will appear here. Start exploring and build your watchlist.
                    </p>
                    <Link to="/" className="empty-cta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                        </svg>
                        Discover Movies
                    </Link>
                </div>
            ) : (
                <div className="favorites-content">
                    <div className="movies-grid">
                        {favorites.map((movie) => (
                            <MovieCard movie={movie} key={movie.id} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Favorites;