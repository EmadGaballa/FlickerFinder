import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { searchMovies } from "../services/api";
import "../css/NavBar.css";

const DEBOUNCE_MS = 400;

function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isMovieDetailPage = location.pathname.startsWith("/movie/");

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => setMenuOpen(false), [location]);



    const handleDiscoverClick = (e) => {
        e.preventDefault();

        navigate("/", {
            state: { focusSearch: true }
        });

        setMenuOpen(false);
    };


    const isActive = (path) => location.pathname === path;

    return (
        <nav className={`navbar${scrolled ? " navbar--scrolled" : ""}${menuOpen ? " navbar--open" : ""}`}>
            <Link to="/" className="navbar-logo">
                <span className="logo-icon">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="12" r="3" fill="currentColor" />
                        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="7.4" cy="7.4" r="1.5" fill="currentColor" />
                        <circle cx="16.6" cy="16.6" r="1.5" fill="currentColor" />
                        <circle cx="16.6" cy="7.4" r="1.5" fill="currentColor" />
                        <circle cx="7.4" cy="16.6" r="1.5" fill="currentColor" />
                    </svg>
                </span>
                <span className="logo-text">
                    Flick<em>Finder</em>
                </span>
            </Link>

           

            <div className="navbar-links">
                <button
                    onClick={handleDiscoverClick}
                    className={`nav-link${isActive("/") ? " nav-link--active" : ""}`}
                >
                    Discover
                </button>
                <Link
                    to="/favorites"
                    className={`nav-link${isActive("/favorites") ? " nav-link--active" : ""}`}
                >
                    <svg viewBox="0 0 24 24" fill={isActive("/favorites") ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="nav-link-icon">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
                <button
                    onClick={handleDiscoverClick}
                    className={`drawer-link drawer-button${isActive("/") ? " drawer-link--active" : ""}`}
                >
                    Discover
                </button>

                <Link
                    to="/favorites"
                    className={`drawer-link${isActive("/favorites") ? " drawer-link--active" : ""}`}
                >
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