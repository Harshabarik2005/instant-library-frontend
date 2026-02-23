import { useState, useEffect } from "react";
import FilterBar from "./components/FilterBar";
import FileUpload from "./components/FileUpload";

const API = `${import.meta.env.VITE_API_URL}/api`;

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState({ search: "", author: "", subject: "", available: false });
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [authors, setAuthors] = useState("");
  const [subjects, setSubjects] = useState("");
  const [isbn, setIsbn] = useState("");
  const [title, setTitle] = useState("");
  const [copies, setCopies] = useState(1);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  useEffect(() => {
    if (user) { fetchBooks(); fetchRequests(); }
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
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.author) queryParams.append("author", filters.author);
      if (filters.subject) queryParams.append("subject", filters.subject);
      if (filters.available) queryParams.append("available", "true");
      const res = await fetch(`${API}/books?${queryParams.toString()}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch (err) {
      console.error("Error fetching books:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRequests() {
    const token = localStorage.getItem("token");
    const url = user?.role === "admin" ? `${API}/admin/requests` : `${API}/requests`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    fetchRequests();
  }

  async function addBook(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch(`${API}/admin/books`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        authors: authors.split(",").map(a => a.trim()).filter(Boolean),
        subjects: subjects.split(",").map(s => s.trim()).filter(Boolean),
        isbn,
        copiesTotal: Number(copies),
        coverUrl: coverImageUrl,
        ebookKey: pdfUrl
      }),
    });
    setTitle(""); setAuthors(""); setSubjects(""); setIsbn(""); setCopies(1);
    setCoverImageUrl(""); setPdfUrl("");
    fetchBooks();
    alert("Book added successfully!");
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null); setBooks([]); setRequests([]);
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
      }}>
        <div className="glass" style={{
          width: "100%",
          maxWidth: "420px",
          padding: "48px 40px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)"
        }}>
          {/* Logo + Title */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "16px",
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "28px", margin: "0 auto 16px"
            }}>📚</div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px" }}>
              Instant Library
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "6px" }}>
              Greenfield University
            </p>
          </div>

          <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--muted)", marginBottom: "6px" }}>
                Email address
              </label>
              <input
                className="input-dark"
                type="email"
                placeholder="you@greenfield.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--muted)", marginBottom: "6px" }}>
                Password
              </label>
              <input
                className="input-dark"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                color: "#f87171",
                fontSize: "13px"
              }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn-primary" style={{ marginTop: "8px", width: "100%", padding: "12px" }}>
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Navbar ── */}
      <header style={{
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "22px" }}>📚</span>
          <span style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.3px" }}>Instant Library</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "6px 14px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "99px"
          }}>
            <div style={{
              width: 28, height: 28,
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500 }}>{user.name}</span>
            <span style={{
              fontSize: "11px",
              padding: "2px 8px",
              borderRadius: "99px",
              background: user.role === "admin" ? "rgba(124,58,237,0.2)" : "rgba(16,185,129,0.15)",
              color: user.role === "admin" ? "#a78bfa" : "#34d399",
              fontWeight: 600,
              textTransform: "capitalize"
            }}>{user.role}</span>
          </div>
          <button className="btn-secondary" onClick={logout} style={{ padding: "7px 18px" }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: "32px", maxWidth: "1280px", margin: "0 auto" }}>
        {/* ── STUDENT VIEW ── */}
        {user.role === "student" && (
          <>
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                📖 Available Books
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
                Browse and request books from our library
              </p>
            </div>

            <FilterBar filters={filters} setFilters={setFilters} onSearch={fetchBooks} isLoading={isLoading} />

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px", animation: "spin 1s linear infinite" }}>⏳</div>
                <p>Loading books...</p>
              </div>
            ) : books.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px",
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: "16px", color: "var(--muted)"
              }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
                <p>No books found matching your filters.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
                {books.map(book => (
                  <div key={book.id} className="book-card">
                    {/* Cover Image */}
                    <div style={{
                      width: "100%", height: "200px", overflow: "hidden",
                      background: book.coverUrl ? "transparent" : "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.2))",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {book.coverUrl
                        ? <img src={book.coverUrl} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: "48px", opacity: 0.5 }}>📕</span>
                      }
                    </div>

                    <div style={{ padding: "16px" }}>
                      <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "10px", lineHeight: 1.3 }}>
                        {book.title}
                      </h4>
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>
                        <b style={{ color: "#c4b5fd" }}>Author:</b> {book.authors?.join(", ")}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>
                        <b style={{ color: "#c4b5fd" }}>Subject:</b> {book.subjects?.join(", ")}
                      </p>
                      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "4px" }}>
                        <b style={{ color: "#c4b5fd" }}>ISBN:</b> {book.isbn || "N/A"}
                      </p>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "3px 10px", borderRadius: "99px", marginBottom: "14px",
                        fontSize: "12px", fontWeight: 600,
                        background: book.copiesAvailable > 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: book.copiesAvailable > 0 ? "#34d399" : "#f87171",
                        border: `1px solid ${book.copiesAvailable > 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`
                      }}>
                        {book.copiesAvailable > 0 ? `✓ ${book.copiesAvailable} available` : "✗ Unavailable"}
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn-primary"
                          onClick={() => requestBook(book.id)}
                          disabled={book.copiesAvailable === 0}
                          style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
                        >
                          Request
                        </button>
                        {book.ebookKey && (
                          <a
                            href={book.ebookKey}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-blue"
                            style={{ flex: 1, padding: "8px 12px", fontSize: "12px" }}
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* My Requests */}
            <div style={{ marginTop: "48px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "16px" }}>
                📌 My Requests
              </h2>
              {requests.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "14px" }}>No requests yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {requests.map(r => (
                    <div key={r.id} className="glass" style={{
                      padding: "14px 20px",
                      display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--muted)" }}>Book ID</p>
                        <p style={{ fontSize: "14px", fontWeight: 600, fontFamily: "monospace" }}>{r.bookId}</p>
                      </div>
                      <span className={r.status === "approved" ? "badge-approved" : "badge-pending"}>
                        {r.status === "approved" ? "✓" : "⏳"} {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── ADMIN VIEW ── */}
        {user.role === "admin" && (
          <>
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px" }}>
                🛠 Admin Panel
              </h2>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px" }}>
                Manage books and approve student requests
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
              {/* Add Book Form */}
              <div className="glass" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  ➕ Add New Book
                </h3>
                <form onSubmit={addBook} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { placeholder: "Book title", value: title, setter: setTitle, required: true },
                    { placeholder: "Authors (comma separated)", value: authors, setter: setAuthors },
                    { placeholder: "Subjects (comma separated)", value: subjects, setter: setSubjects },
                    { placeholder: "ISBN", value: isbn, setter: setIsbn },
                  ].map((f, i) => (
                    <input
                      key={i}
                      className="input-dark"
                      type="text"
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={e => f.setter(e.target.value)}
                      required={f.required}
                    />
                  ))}
                  <input
                    className="input-dark"
                    type="number"
                    placeholder="Number of copies"
                    value={copies}
                    min="1"
                    onChange={e => setCopies(e.target.value)}
                  />

                  <FileUpload
                    label="Cover Image"
                    accept="image/*"
                    uploadType="Cover Image"
                    apiBaseUrl={API}
                    token={localStorage.getItem("token")}
                    onUploadComplete={url => setCoverImageUrl(url)}
                    onUploadStateChange={isUploading => setIsUploadingCover(isUploading)}
                  />

                  <FileUpload
                    label="PDF / eBook"
                    accept="application/pdf"
                    uploadType="PDF Document"
                    apiBaseUrl={API}
                    token={localStorage.getItem("token")}
                    onUploadComplete={url => setPdfUrl(url)}
                    onUploadStateChange={isUploading => setIsUploadingPdf(isUploading)}
                  />

                  <button
                    className="btn-primary"
                    style={{ marginTop: "8px", padding: "12px" }}
                    disabled={isUploadingCover || isUploadingPdf}
                  >
                    {isUploadingCover || isUploadingPdf ? "Uploading files..." : "Add Book"}
                  </button>
                </form>
              </div>

              {/* Book Requests */}
              <div className="glass" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "20px" }}>
                  📋 Book Requests
                </h3>
                {requests.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontSize: "14px" }}>No pending requests.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {requests.map(r => (
                      <div key={r.id} style={{
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px"
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "2px" }}>Request</p>
                          <p style={{ fontSize: "13px", fontWeight: 600, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                            {r.id}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                            Book: <span style={{ color: "var(--text)" }}>{r.bookId}</span>
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                          <span className={r.status === "approved" ? "badge-approved" : "badge-pending"}>
                            {r.status === "approved" ? "✓" : "⏳"} {r.status}
                          </span>
                          {r.status === "pending" && (
                            <button
                              className="btn-primary"
                              onClick={() => approveRequest(r.id)}
                              style={{ padding: "5px 14px", fontSize: "12px" }}
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
