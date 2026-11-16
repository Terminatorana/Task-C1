import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logoutUser } from "./authService";
import "./NavBar.css";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const user = getCurrentUser();

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">DEV@Deakin</Link>

      <form className="navbar-search-form" onSubmit={handleSearch} role="search">
        <input
          className="navbar-search"
          type="search"
          placeholder="Search articles, tutorials and posts..."
          aria-label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit" className="navbar-search-button">Search</button>
      </form>

      <nav className="navbar-links">
        <Link to="/profile">Profile</Link>
        <Link to="/post">Post</Link>
        {user ? (
          <button type="button" className="navbar-logout" onClick={handleLogout}>Logout</button>
        ) : (
          <Link to="/login" state={{ from: location.pathname }}>Login</Link>
        )}
      </nav>
    </header>
  );
}
