import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const SESSION_KEY = "devdeakin_user";

function createSessionUser(firebaseUser, profile = {}) {
  return {
    id: firebaseUser.uid,
    name: profile.name || firebaseUser.displayName || "",
    email: firebaseUser.email || profile.email || "",
  };
}

function storeSessionUser(user) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

// Creates the account with Firebase Authentication and stores its public profile
// in Firestore. Passwords are managed by Firebase Authentication, not Firestore.
export async function registerUser({ name, email, password }) {
  const normalisedName = name.trim();
  const normalisedEmail = email.trim().toLowerCase();

  if (!normalisedName || !normalisedEmail || !password) {
    throw new Error("MISSING_DETAILS");
  }

  let createdUser = null;

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalisedEmail,
      password
    );
    createdUser = credential.user;

    await updateProfile(createdUser, {
      displayName: normalisedName,
    });

    await setDoc(doc(db, "users", createdUser.uid), {
      name: normalisedName,
      email: normalisedEmail,
      createdAt: serverTimestamp(),
    });

    // Keep the existing project flow: registration returns the user to Login.
    await signOut(auth);
    storeSessionUser(null);
  } catch (error) {
    // Avoid leaving an Auth account behind if profile creation failed.
    if (createdUser && auth.currentUser?.uid === createdUser.uid) {
      try {
        await deleteUser(createdUser);
      } catch (cleanupError) {
        console.error("Could not clean up incomplete Firebase account:", cleanupError);
      }
    }

    if (error.code === "auth/email-already-in-use") {
      throw new Error("EMAIL_TAKEN");
    }

    throw error;
  }
}

// Firebase Authentication verifies the password. Firestore stores profile data only.
export async function loginUser({ email, password }) {
  const normalisedEmail = email.trim().toLowerCase();

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalisedEmail,
      password
    );

    const userRef = doc(db, "users", credential.user.uid);
    const userSnapshot = await getDoc(userRef);
    const profile = userSnapshot.exists() ? userSnapshot.data() : {};

    const sessionUser = createSessionUser(credential.user, profile);
    storeSessionUser(sessionUser);

    return sessionUser;
  } catch (error) {
    if (
      [
        "auth/invalid-credential",
        "auth/user-not-found",
        "auth/wrong-password",
        "auth/invalid-email",
      ].includes(error.code)
    ) {
      throw new Error("INVALID_CREDENTIALS");
    }

    throw error;
  }
}

// This cached profile is for displaying the UI only. Firestore rules use
// Firebase Authentication to verify identity for protected database writes.
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

// Keep the cached profile in sync with Firebase Authentication on page refresh,
// login and logout.
export function observeCurrentUser(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      storeSessionUser(null);
      callback(null);
      return;
    }

    try {
      const userSnapshot = await getDoc(doc(db, "users", firebaseUser.uid));
      const profile = userSnapshot.exists() ? userSnapshot.data() : {};
      const sessionUser = createSessionUser(firebaseUser, profile);

      storeSessionUser(sessionUser);
      callback(sessionUser);
    } catch (error) {
      console.error("Could not load the user profile:", error);
      const sessionUser = createSessionUser(firebaseUser);
      storeSessionUser(sessionUser);
      callback(sessionUser);
    }
  });
}

export async function logoutUser() {
  await signOut(auth);
  storeSessionUser(null);
}
