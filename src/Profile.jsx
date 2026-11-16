import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { observeCurrentUser } from "./authService";
import "./Auth.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => observeCurrentUser((currentUser) => {
    setUser(currentUser);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    let active = true;
    async function loadMyPosts() {
      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const snapshot = await getDocs(
          query(collection(db, "posts"), where("authorUid", "==", user.id))
        );
        if (active) setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (error) {
        console.error("Could not load your posts:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (authReady) loadMyPosts();
    return () => { active = false; };
  }, [user, authReady]);

  if (!authReady) return <div className="auth-page"><p>Loading profile...</p></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">My Profile</h2>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
        <h3>My Posts</h3>
        {loading ? <p>Loading your posts...</p> : posts.length === 0 ? <p>You have not published any posts yet.</p> : posts.map((post) => (
          <article key={post.id}>
            <h4>{post.title}</h4>
            <p>{post.type === "question" ? post.description : post.abstract}</p>
            <small>{post.type}</small>
          </article>
        ))}
        <p><Link to="/post">Create a post</Link></p>
      </div>
    </div>
  );
}
