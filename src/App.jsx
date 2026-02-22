import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_URL}/api`;
console.log("API URL:", API);

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [authors, setAuthors] = useState("");
  const [subjects, setSubjects] = useState("");
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (user) {
      fetchBooks();
      fetchRequests();
    }
  }, [user]);

  async function login(e) {
    e.preventDefault();
    setError("");

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) return setError(data.error);

    localStorage.setItem("token", data.token);
    setUser(data.user);
  }

  async function fetchBooks() {
    const res = await fetch(`${API}/books`);
    const data = await res.json();
    setBooks(data.books);
  }

  async function fetchRequests() {
    const token = localStorage.getItem("token");
    const url =
      user?.role === "admin"
        ? `${API}/admin/requests`
        : `${API}/requests`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setRequests(data.requests);
  }

  async function requestBook(bookId) {
    const token = localStorage.getItem("token");

    await fetch(`${API}/requests/${bookId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchRequests();
  }

  async function approveRequest(id) {
    const token = localStorage.getItem("token");

    await fetch(`${API}/admin/requests/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "approved" }),
    });

    fetchRequests();
  }

  // 🔹 NEW: Add Book
  async function addBook(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");

    await fetch(`${API}/admin/books`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        authors: authors.split(",").map(a => a.trim()),
        subjects: subjects.split(",").map(s => s.trim()),
        isbn,
        copiesTotal: Number(copies),
      }),
    });

    setTitle("");
    setCopies(1);
    fetchBooks();
    alert("Book added!");
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setBooks([]);
    setRequests([]);
  }

  // ---------------- LOGIN ----------------
  if (!user) {
    return (
      <div style={styles.container}>
        <h2>Instant Library Login</h2>
        <form onSubmit={login} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          <button style={styles.button}>Login</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  // ---------------- DASHBOARD ----------------
  return (
    <div style={styles.container}>
      <h2>Welcome, {user.name} ({user.role})</h2>
      <button onClick={logout}>Logout</button>

      {/* STUDENT VIEW */}
      {user.role === "student" && (
        <>
          <h3>📚 Available Books</h3>
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: 10,
              marginBottom: 15,
              width: 250,
              display: "block"
            }}
          />
          <div style={styles.bookGrid}>
            {books
              .filter(book =>
                book.title.toLowerCase().includes(search.toLowerCase())
              )
              .map((book) => (
                <div key={book.id} style={styles.card}>
                  <h4>{book.title}</h4>
                  <p><b>Author:</b> {book.authors?.join(", ")}</p>
                  <p><b>Subject:</b> {book.subjects?.join(", ")}</p>
                  <p><b>ISBN:</b> {book.isbn || "N/A"}</p>
                  <p><b>Available:</b> {book.copiesAvailable}</p>
                  <button
                    onClick={() => requestBook(book.id)}
                    disabled={book.copiesAvailable === 0}
                  >
                    Request Book
                  </button>
                </div>
              ))}
          </div>

          <h3 style={{ marginTop: 30 }}>📌 My Requests</h3>
          {requests.map((r) => (
            <div key={r.id}>
              {r.bookId} — <b>{r.status}</b>
            </div>
          ))}
        </>
      )}

      {/* ADMIN VIEW */}
      {user.role === "admin" && (
        <>
          <h3>🛠 Admin Panel</h3>

          {/* 🔹 Add Book Form */}
          <form onSubmit={addBook} style={styles.form}>
            <h4>Add New Book</h4>

            <input
              type="text"
              placeholder="Book Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Authors (comma separated)"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="Subjects (comma separated)"
              value={subjects}
              onChange={(e) => setSubjects(e.target.value)}
              style={styles.input}
            />

            <input
              type="text"
              placeholder="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Copies"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              min="1"
              style={styles.input}
            />

            <button style={styles.button}>Add Book</button>
          </form>


          {/* Requests */}
          <h4>Book Requests</h4>
          {requests.map((r) => (
            <div key={r.id} style={styles.card}>
              <p><b>Request ID:</b> {r.id}</p>
              <p><b>Book:</b> {r.bookId}</p>
              <p><b>Status:</b> {r.status}</p>
              {r.status === "pending" && (
                <button onClick={() => approveRequest(r.id)}>
                  Approve
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 20, fontFamily: "Arial" },
  form: { display: "flex", flexDirection: "column", gap: 10, width: 250, marginTop: 10 },
  input: { padding: 10 },
  button: { padding: 10, background: "#4CAF50", color: "white", border: "none" },
  bookGrid: { display: "flex", gap: 15, flexWrap: "wrap", marginTop: 20 },
  card: { border: "1px solid #ddd", padding: 15, marginTop: 10 },
};
