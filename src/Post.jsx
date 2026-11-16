import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Popup from "./Popup";
import { auth, db } from "./firebase";
import "./Post.css";

const emptyForm = { title: "", description: "", abstract: "", articleText: "", tags: "" };

function parseTags(text) {
  return text.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function validate(postType, form) {
  const errors = {};
  const title = form.title.trim();

  if (title.length < 5) errors.title = "Title must be at least 5 characters.";
  else if (title.length > 120) errors.title = "Title must be 120 characters or fewer.";

  if (postType === "question") {
    if (form.description.trim().length < 20) errors.description = "Please describe your problem in at least 20 characters.";
  } else {
    const abstract = form.abstract.trim();
    if (abstract.length < 20) errors.abstract = "Abstract must be at least 20 characters.";
    else if (abstract.length > 500) errors.abstract = "Abstract must be 500 characters or fewer.";
    if (form.articleText.trim().length < 100) errors.articleText = "Article text must be at least 100 characters.";
  }

  const tags = parseTags(form.tags);
  if (tags.length === 0) errors.tags = "Please add at least one tag.";
  else if (tags.length > 3) errors.tags = "You can add up to 3 tags.";
  else if (tags.some((tag) => !/^[\w+#.-]{1,20}$/.test(tag))) errors.tags = "Each tag can use letters, numbers, + # . - and be up to 20 characters.";

  return errors;
}

export default function Post() {
  const navigate = useNavigate();
  const [postType, setPostType] = useState("question");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [popup, setPopup] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setErrors({}); }, [postType]);

  const handleChange = (event) =>
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!auth.currentUser) {
      navigate("/login", { state: { from: "/post" } });
      return;
    }

    const found = validate(postType, form);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setPopup({ type: "error", message: "Your post could not be saved. Please fix the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      const tags = parseTags(form.tags);
      const title = form.title.trim();
      const postData = {
        type: postType,
        title,
        searchTitle: title.toLowerCase(),
        tags,
        authorUid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || "DEV@Deakin member",
        createdAt: serverTimestamp(),
      };

      if (postType === "question") postData.description = form.description.trim();
      else {
        postData.abstract = form.abstract.trim();
        postData.articleText = form.articleText.trim();
      }

      await addDoc(collection(db, "posts"), postData);
      setPopup({ type: "success", message: `Your ${postType} has been saved successfully!` });
      setForm(emptyForm);
    } catch (error) {
      console.error("Could not save post:", error);
      setPopup({ type: "error", message: "We could not save your post. Check your connection and Firestore rules, then try again." });
    } finally {
      setSaving(false);
    }
  };

  const isQuestion = postType === "question";

  return (
    <div className="post-page">
      <form className="post-card" onSubmit={handleSubmit} noValidate>
        <h2 className="post-bar">New Post</h2>
        <div className="post-type">
          <span>Select Post Type:</span>
          <label><input type="radio" name="postType" value="question" checked={isQuestion} onChange={() => setPostType("question")} /> Question</label>
          <label><input type="radio" name="postType" value="article" checked={!isQuestion} onChange={() => setPostType("article")} /> Article</label>
        </div>
        <h3 className="post-bar post-bar-sub">What do you want to ask or share</h3>
        <label className="post-row" htmlFor="title"><span>Title</span>
          <input id="title" name="title" type="text" value={form.title} onChange={handleChange} placeholder={isQuestion ? "Start your question with how, what, why, etc." : "Enter a descriptive title"} />
        </label>
        {errors.title && <p className="post-error">{errors.title}</p>}
        {isQuestion ? <>
          <label className="post-label" htmlFor="description">Describe your problem</label>
          <textarea id="description" name="description" className="post-textarea post-textarea-large" value={form.description} onChange={handleChange} />
          {errors.description && <p className="post-error">{errors.description}</p>}
        </> : <>
          <label className="post-label" htmlFor="abstract">Abstract</label>
          <textarea id="abstract" name="abstract" className="post-textarea post-textarea-small" placeholder="Enter a 1-paragraph abstract" value={form.abstract} onChange={handleChange} />
          {errors.abstract && <p className="post-error">{errors.abstract}</p>}
          <label className="post-label" htmlFor="articleText">Article Text</label>
          <textarea id="articleText" name="articleText" className="post-textarea post-textarea-large" placeholder="Write your article here" value={form.articleText} onChange={handleChange} />
          {errors.articleText && <p className="post-error">{errors.articleText}</p>}
        </>}
        <label className="post-row" htmlFor="tags"><span>Tags</span>
          <input id="tags" name="tags" type="text" value={form.tags} onChange={handleChange} placeholder={`Add up to 3 tags separated by commas, e.g. Java, React`} />
        </label>
        {errors.tags && <p className="post-error">{errors.tags}</p>}
        <div className="post-actions">
          <button type="submit" className="post-button" disabled={saving}>{saving ? "Saving..." : "Post"}</button>
        </div>
      </form>
      {popup && <Popup type={popup.type} message={popup.message} onClose={() => setPopup(null)} />}
    </div>
  );
}
