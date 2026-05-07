import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMovieDetails } from "../services/api";
import { useMovieContext } from "../contexts/MovieContext";
import "../css/MovieDetail.css";

const TMDB_IMG = "https://image.tmdb.org/t/p/";

function MovieDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const {
        isFavorite,
        addToFavorites,
        removeFromFavorites,
    } = useMovieContext();

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [trailerOpen, setTrailerOpen] = useState(false);

    const favorite = movie ? isFavorite(movie.id) : false;

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

        const loadMovie = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getMovieDetails(id);

                setMovie(data);
            } catch (err) {
                console.log(err);
                setError("Failed to load cinematic data...");
            } finally {
                setLoading(false);
            }
        };

        loadMovie();
    }, [id]);

    const toggleFavorite = () => {
        if (!movie) return;

        if (favorite) {
            removeFromFavorites(movie.id);
        } else {
            addToFavorites(movie);
        }
    };

    const formatRuntime = (mins) => {
        if (!mins) return null;

        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;

        return hours > 0
            ? `${hours}h ${minutes}m`
            : `${minutes}m`;
    };

    const formatMoney = (value) => {
        if (!value || value === 0) return null;

        return `$${new Intl.NumberFormat("en-US").format(value)}`;
    };

    const ratingColor =
        movie?.vote_average >= 8
            ? "#ffd166"
            : movie?.vote_average >= 6.5
            ? "#f4a261"
            : "#e76f51";

    if (loading) {
        return (
            <div className="detail-page">
                <div className="detail-loading">
                    <div className="loading-glow"></div>

                    <h1>Loading cinematic universe...</h1>

                    <p>Syncing movie database ✨</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="detail-page detail-error">
                <div className="error-box">
                    <h2>⚠ System Error</h2>

                    <p>{error}</p>

                    <button
                        className="detail-back-btn"
                        onClick={() => navigate(-1)}
                    >
                        ← Return
                    </button>
                </div>
            </div>
        );
    }

    if (!movie) return null;

    return (
        <div className="detail-page">

            <div className="detail-backdrop">
                {movie.backdrop_path && (
                    <img
                        src={`${TMDB_IMG}original${movie.backdrop_path}`}
                        alt={movie.title}
                        className="backdrop-img"
                    />
                )}

                <div className="backdrop-overlay"></div>
                <div className="backdrop-fade"></div>
            </div>

            <button
                className="detail-back"
                onClick={() => navigate(-1)}
            >
                ← Back
            </button>

            <div className="detail-content">

                <div className="detail-poster">
                    {movie.poster_path ? (
                        <img
                            src={`${TMDB_IMG}w500${movie.poster_path}`}
                            alt={movie.title}
                        />
                    ) : (
                        <div className="detail-poster-fallback">
                            🎬
                        </div>
                    )}
                </div>

                <div className="detail-info">

                    {movie.genres?.length > 0 && (
                        <div className="detail-genres">
                            {movie.genres.map((genre) => (
                                <span
                                    key={genre.id}
                                    className="genre-pill"
                                >
                                    {genre.name}
                                </span>
                            ))}
                        </div>
                    )}

                    <h1 className="detail-title">
                        {movie.title}
                    </h1>

                    {movie.tagline && (
                        <p className="detail-tagline">
                            “{movie.tagline}”
                        </p>
                    )}

                    <div className="detail-meta">

                        {movie.vote_average > 0 && (
                            <span
                                className="meta-rating"
                                style={{ color: ratingColor }}
                            >
                                ⭐ {movie.vote_average.toFixed(1)}

                                <span className="meta-votes">
                                    ({movie.vote_count?.toLocaleString()} votes)
                                </span>
                            </span>
                        )}

                        {movie.release_date && (
                            <span className="meta-item">
                                📅{" "}
                                {new Date(
                                    movie.release_date
                                ).getFullYear()}
                            </span>
                        )}

                        {formatRuntime(movie.runtime) && (
                            <span className="meta-item">
                                🕐 {formatRuntime(movie.runtime)}
                            </span>
                        )}

                        {movie.original_language && (
                            <span className="meta-item">
                                🌍{" "}
                                {movie.original_language.toUpperCase()}
                            </span>
                        )}
                    </div>

                    {movie.overview && (
                        <div className="detail-overview">
                            <h2>Synopsis</h2>

                            <p>{movie.overview}</p>
                        </div>
                    )}

                    <div className="detail-actions">

                        <button
                            className={`action-btn favorite-btn ${
                                favorite ? "active" : ""
                            }`}
                            onClick={toggleFavorite}
                        >
                            {favorite
                                ? "💜 Favorited"
                                : "🤍 Add to Favorites"}
                        </button>

                        {movie.trailer && (
                            <button
                                className="action-btn trailer-btn"
                                onClick={() => setTrailerOpen(true)}
                            >
                                ▶ Watch Trailer
                            </button>
                        )}
                    </div>

                    <div className="detail-facts">

                        {movie.status && (
                            <div className="fact">
                                <span className="fact-label">
                                    Status
                                </span>

                                <span className="fact-value">
                                    {movie.status}
                                </span>
                            </div>
                        )}

                        {formatMoney(movie.budget) && (
                            <div className="fact">
                                <span className="fact-label">
                                    Budget
                                </span>

                                <span className="fact-value">
                                    {formatMoney(movie.budget)}
                                </span>
                            </div>
                        )}

                        {formatMoney(movie.revenue) && (
                            <div className="fact">
                                <span className="fact-label">
                                    Revenue
                                </span>

                                <span className="fact-value">
                                    {formatMoney(movie.revenue)}
                                </span>
                            </div>
                        )}

                        {movie.production_companies?.[0] && (
                            <div className="fact">
                                <span className="fact-label">
                                    Studio
                                </span>

                                <span className="fact-value">
                                    {movie.production_companies[0].name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {movie.cast?.length > 0 && (
                <div className="detail-cast-section">

                    <h2 className="detail-section-title">
                        Cast
                    </h2>

                    <div className="cast-row">
                        {movie.cast.slice(0, 12).map((person) => (
                            <div
                                key={person.cast_id ?? person.id}
                                className="cast-card"
                            >
                                <div className="cast-photo">

                                    {person.profile_path ? (
                                        <img
                                            src={`${TMDB_IMG}w185${person.profile_path}`}
                                            alt={person.name}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="cast-photo-fallback">
                                            👤
                                        </div>
                                    )}
                                </div>

                                <p className="cast-name">
                                    {person.name}
                                </p>

                                <p className="cast-character">
                                    {person.character}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {trailerOpen && movie.trailer && (
                <div
                    className="trailer-modal"
                    onClick={() => setTrailerOpen(false)}
                >
                    <div
                        className="trailer-inner"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="trailer-close"
                            onClick={() => setTrailerOpen(false)}
                        >
                            ✕
                        </button>

                        <iframe
                            src={`https://www.youtube.com/embed/${movie.trailer.key}?autoplay=1`}
                            title="Trailer"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default MovieDetail;