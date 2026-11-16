import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { articlesList, tutorialsList } from "./content";
import { db } from "./firebase";

export default function Search() {
  const [params] = useSearchParams();
  const term = (params.get("q") || "").trim();
  const [posts, setPosts] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPosts() {
      if (!term) {
        setPosts([]);
        return;
      }
      try {
        const snapshot = await getDocs(
          query(collection(db, "posts"), where("searchTitle", ">=", term.toLowerCase()), where("searchTitle", "<=", term.toLowerCase() + "\uf8ff"), limit(20))
        );
        if (active) setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (error) {
        console.error("Post search failed:", error);
        if (active) setLoadError("Community posts could not be loaded. Showing articles and tutorials instead.");
      }
    }

    loadPosts();
    return () => { active = false; };
  }, [term]);

  const localResults = useMemo(() => {
    const needle = term.toLowerCase();
    if (!needle) return [];
    const articles = articlesList
      .filter((item) => [item.title, item.description, item.author].some((value) => String(value || "").toLowerCase().includes(needle)))
      .map((item) => ({ ...item, kind: "Article" }));
    const tutorials = tutorialsList
      .filter((item) => [item.title, item.description, item.username].some((value) => String(value || "").toLowerCase().includes(needle)))
      .map((item) => ({ ...item, kind: "Tutorial" }));
    return [...articles, ...tutorials];
  }, [term]);

  return (
    <main className="search-page section-container">
      <h2 className="section-heading">Search results</h2>
      <p>Showing matches for: <strong>{term || "Enter a search term"}</strong></p>
      {loadError && <p role="status">{loadError}</p>}
      {!term && <p>Use the search box in the navigation bar to find articles, tutorials and community posts.</p>}
      {term && localResults.length === 0 && posts.length === 0 && <p>No matching articles or tutorials were found.</p>}

      {localResults.map((item) => (
        <article className="search-result" key={`${item.kind}-${item.id}`}>
          {item.image && <img src={item.image} alt="" />}
          <div><small>{item.kind}</small><h3>{item.title}</h3><p>{item.description}</p></div>
        </article>
      ))}

      {posts.map((post) => (
        <article className="search-result" key={post.id}>
          <div><small>Community {post.type}</small><h3>{post.title}</h3>
            <p>{post.type === "question" ? post.description : post.abstract}</p>
            <p>{(post.tags || []).map((tag) => `#${tag}`).join(" ")}</p>
          </div>
        </article>
      ))}
      <p><Link to="/">Back to home</Link></p>
    </main>
  );
}
