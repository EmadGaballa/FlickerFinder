import { Routes, Route } from "react-router-dom";
import { MovieProvider } from "./contexts/MovieContext";
import Home from "./pages/Home";
import Favorites from "./pages/Favorites";
import MovieDetail from "./pages/MovieDetail";
import NavBar from "./components/NavBar";
import "./css/App.css";

function App() {
  return (
    <MovieProvider>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
        </Routes>
      </main>
    </MovieProvider>
  );
}

export default App;