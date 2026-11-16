import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "./firebase";
import { getCurrentUser } from "./authService";
import "./Auth.css";

export default function Profile() {
  const user = getCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadMyPosts() {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const snapshot = await getDocs(query(collection(db, "posts"), where("authorUid", "==", auth.currentUser.uid)));
        if (active) setPosts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      } catch (error) {
        console.error("Could not load your posts:", error);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadMyPosts();
    return () => { active = false; };
  }, []);

  if (!auth.currentUser || !user) return <Navigate to="/login" replace />;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">My Profile</h2>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
        <h3>My Posts</h3>
        {loading ? <p>Loading your posts...</p> : posts.length === 0 ? <p>You have not published any posts yet.</p> : posts.map((post) => (
          <article key={post.id}><h4>{post.title}</h4><p>{post.type === "question" ? post.description : post.abstract}</p><small>{post.type}</small></article>
        ))}
        <p><Link to="/post">Create a post</Link></p>
      </div>
    </div>
  );
}
