import { createContext, useState, useContext, useEffect } from "react";

const MovieContext = createContext();

export const useMovieContext = () => useContext(MovieContext);

export const MovieProvider = ({ children }) => {

    const [favorites, setFavorites] = useState(() => {
        try {
            const storedFavs = localStorage.getItem("favorites");
            return storedFavs ? JSON.parse(storedFavs) : [];
        } catch (error) {
            console.error("Error parsing favorites from localStorage:", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(
                "favorites",
                JSON.stringify(favorites)
            );
        } catch (error) {
            console.error("Error saving favorites:", error);
        }
    }, [favorites]);

    const addToFavorites = (movie) => {
        setFavorites((prev) => {
            if (!movie) return prev;

            const exists = prev.some((m) => m.id === movie.id);
            if (exists) return prev;

            return [...prev, movie];
        });
    };

    const removeFromFavorites = (movieId) => {
        setFavorites((prev) =>
            prev.filter((movie) => movie.id !== movieId)
        );
    };

    const isFavorite = (movieId) => {
        return favorites.some((movie) => movie.id === movieId);
    };

    const value = {
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
    };

    return (
        <MovieContext.Provider value={value}>
            {children}
        </MovieContext.Provider>
    );
};