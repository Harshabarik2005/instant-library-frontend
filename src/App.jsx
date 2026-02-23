import { useState, useEffect, useCallback } from "react";
import FilterBar from "./components/FilterBar";
import FileUpload from "./components/FileUpload";

const API = `${import.meta.env.VITE_API_URL}/api`;

// ─── Toast Hook ─────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

// ─── Toast UI ────────────────────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  const icons = { success: "✓", error: "✕", info: "◆" };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span style={{ fontWeight: 700 }}>{icons[t.type]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner({ size = 20 }) {
  return <div className="spinner" style={{ width: size, height: size }} />;
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  /* Auth */
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");

  /* Books */
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", author: "", subject: "", available: false });

  /* Requests */
  const [requests, setRequests] = useState([]);

  /* Admin – Add Book */
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [subjects, setSubjects] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState(1);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [addingBook, setAddingBook] = useState(false);

  /* UI */
  const { toasts, addToast } = useToast();

  useEffect(() => {
    if (user) { fetchBooks(); fetchRequests(); }
  }, [user]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  async function login(e) {
    e.preventDefault();
    setError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      localStorage.setItem("token", data.token);
      setUser(data.user);
      addToast(`Welcome back, ${data.user.name}!`, "success");
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null); setBooks([]); setRequests([]);
    addToast("You have been logged out.", "info");
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  async function fetchBooks() {
    setBooksLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.search) q.append("search", filters.search);
      if (filters.author) q.append("author", filters.author);
      if (filters.subject) q.append("subject", filters.subject);
      if (filters.available) q.append("available", "true");
      const res = await fetch(`${API}/books?${q}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch {
      addToast("Failed to fetch books.", "error");
    } finally {
      setBooksLoading(false);
    }
  }

  async function fetchRequests() {
    const token = localStorage.getItem("token");
    const url = user?.role === "admin" ? `${API}/admin/requests` : `${API}/requests`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      addToast("Failed to load requests.", "error");
    }
  }

  async function requestBook(bookId) {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/requests/${bookId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      addToast("Book requested successfully!", "success");
      fetchRequests();
    } catch {
      addToast("Failed to submit request.", "error");
    }
  }

  async function approveRequest(id) {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/admin/requests/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      addToast("Request approved.", "success");
      fetchRequests();
    } catch {
      addToast("Failed to approve request.", "error");
    }
  }

  async function addBook(e) {
    e.preventDefault();
    setAddingBook(true);
    const token = localStorage.getItem("token");
    try {
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
          ebookKey: pdfUrl,
        }),
      });
      setTitle(""); setAuthors(""); setSubjects(""); setIsbn(""); setCopies(1);
      setCoverImageUrl(""); setPdfUrl("");
      addToast(`"${title}" added to the library!`, "success");
      fetchBooks();
    } catch {
      addToast("Failed to add book.", "error");
    } finally {
      setAddingBook(false);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LOGIN PAGE  — matches reference design
  // ────────────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} />

        <div style={{ display: "flex", minHeight: "100vh", overflow: "hidden" }}>

          {/* ── LEFT HERO PANEL (dark navy) ── */}
          <div style={{
            flex: 1,
            position: "relative",
            background: "linear-gradient(160deg, #0a1628 0%, #0f1f3d 60%, #0b1220 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "36px 52px 40px",
            overflow: "hidden",
            minWidth: 0,
          }}>
            {/* Subtle grid-dot overlay */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.04,
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px", pointerEvents: "none"
            }} />

            {/* Logo row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, boxShadow: "0 2px 12px rgba(245,158,11,0.4)"
              }}>📚</div>
              <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>
                Instant Library
              </span>
            </div>

            {/* Hero copy */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <h1 style={{
                fontSize: "clamp(34px, 3.8vw, 52px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                color: "#fff",
                marginBottom: 10,
              }}>
                Search. Borrow.
              </h1>
              <h1 style={{
                fontSize: "clamp(34px, 3.8vw, 52px)",
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-1.5px",
                color: "#f59e0b",
                marginBottom: 22,
              }}>
                Get Access.
              </h1>
              <p style={{ fontSize: 15, color: "#8fa3bf", lineHeight: 1.7, maxWidth: 380, marginBottom: 40 }}>
                Discover books, manage requests, and access digital resources anytime, anywhere.
              </p>

              {/* Stats */}
              <div style={{ display: "flex", gap: 40 }}>
                {[
                  { value: "10,000+", label: "BOOKS AVAILABLE" },
                  { value: "95%", label: "AVAILABILITY RATE" },
                ].map(s => (
                  <div key={s.label}>
                    <p style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.8px", marginTop: 2 }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p style={{ fontSize: 12, color: "#3d5168", position: "relative" }}>
              Powered by Greenfield University
            </p>
          </div>

          {/* ── RIGHT PANEL (white) ── */}
          <div style={{
            width: "min(520px, 100%)",
            background: "#f0f4f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 32px",
          }}>
            {/* Card */}
            <div style={{
              width: "100%",
              maxWidth: 380,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "36px 32px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.4px" }}>
                Sign in
              </h2>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 28 }}>
                Enter your credentials to continue
              </p>

              <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Email */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      color: "#94a3b8", fontSize: 14, userSelect: "none"
                    }}>✉</span>
                    <input
                      type="email"
                      placeholder="you@greenfield.edu"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 36px",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "#0f172a",
                        fontFamily: "Inter, sans-serif",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={e => { e.target.style.borderColor = "#f59e0b"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      color: "#94a3b8", fontSize: 14, userSelect: "none"
                    }}>🔒</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 36px",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "#0f172a",
                        fontFamily: "Inter, sans-serif",
                        outline: "none",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={e => { e.target.style.borderColor = "#f59e0b"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.15)"; }}
                      onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    padding: "9px 12px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    color: "#dc2626",
                    fontSize: 13,
                  }}>
                    ⚠ {error}
                  </div>
                )}

                {/* Sign In Button — dark navy matching reference */}
                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    marginTop: 6,
                    background: authLoading ? "#334155" : "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 700,
                    fontFamily: "Inter, sans-serif",
                    cursor: authLoading ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => { if (!authLoading) e.currentTarget.style.background = "#1e293b"; }}
                  onMouseLeave={e => { if (!authLoading) e.currentTarget.style.background = "#0f172a"; }}
                >
                  {authLoading ? <Spinner size={18} /> : <>Sign In →</>}
                </button>
              </form>

              <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                Don't have an account?{" "}
                <span style={{ color: "#0f172a", fontWeight: 600, cursor: "pointer" }}>
                  Contact your admin
                </span>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }


  // ────────────────────────────────────────────────────────────────────────────
  // DASHBOARD
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* ── Sticky Navbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,13,26,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 64
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, boxShadow: "0 2px 10px rgba(245,158,11,0.3)"
          }}>📚</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Instant Library</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 14px 5px 6px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 99
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 12, color: "#0b1220"
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</span>
            <span className="badge badge-role" style={{ textTransform: "capitalize" }}>{user.role}</span>
          </div>

          <button className="btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* ── Page Body ── */}
      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "36px 32px" }}>

        {/* ═══ STUDENT VIEW ═══════════════════════════════════════════════════ */}
        {user.role === "student" && (
          <>
            {/* Page header */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Available Books
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                Browse, filter and request books from the library
              </p>
            </div>

            {/* Filter bar */}
            <FilterBar
              filters={filters} setFilters={setFilters}
              onSearch={fetchBooks} isLoading={booksLoading}
            />

            {/* Books grid */}
            {booksLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
                <div style={{ textAlign: "center", color: "#64748b" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                  </div>
                  <p style={{ fontSize: 14 }}>Loading books...</p>
                </div>
              </div>
            ) : books.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>No books found</p>
                <p style={{ fontSize: 13 }}>Try adjusting your search filters</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {books.map(book => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onRequest={requestBook}
                  />
                ))}
              </div>
            )}

            {/* My Requests */}
            <section style={{ marginTop: 56 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>My Requests</h2>
              {requests.length === 0 ? (
                <p style={{ color: "#4b5563", fontSize: 14 }}>You haven't requested any books yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {requests.map(r => (
                    <div key={r.id} className="glass" style={{
                      padding: "14px 20px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 16
                    }}>
                      <div>
                        <p style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>Book ID</p>
                        <p style={{ fontSize: 13, fontFamily: "monospace", color: "#cbd5e1" }}>{r.bookId}</p>
                      </div>
                      <span className={`badge badge-${r.status}`}>
                        {r.status === "approved" ? "✓" : r.status === "rejected" ? "✕" : "⏳"} {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ═══ ADMIN VIEW ════════════════════════════════════════════════════ */}
        {user.role === "admin" && (
          <>
            {/* Page header */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>Admin Panel</h2>
              <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                Manage the library catalogue and approve student requests
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

              {/* Add Book Form */}
              <div className="glass" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
                  ➕ Add New Book
                </h3>
                <form onSubmit={addBook} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { placeholder: "Book title *", value: title, setter: setTitle, req: true },
                    { placeholder: "Authors (comma separated)", value: authors, setter: setAuthors },
                    { placeholder: "Subjects (comma separated)", value: subjects, setter: setSubjects },
                    { placeholder: "ISBN", value: isbn, setter: setIsbn },
                  ].map((f, i) => (
                    <input key={i} className="input-simple" type="text"
                      placeholder={f.placeholder} value={f.value}
                      onChange={e => f.setter(e.target.value)} required={f.req} />
                  ))}

                  <input className="input-simple" type="number"
                    placeholder="Number of copies" value={copies} min="1"
                    onChange={e => setCopies(e.target.value)} />

                  <FileUpload
                    label="Cover Image" accept="image/*"
                    apiBaseUrl={API} token={localStorage.getItem("token")}
                    onUploadComplete={url => setCoverImageUrl(url)}
                    onUploadStateChange={v => setIsUploadingCover(v)}
                  />
                  <FileUpload
                    label="PDF / eBook" accept="application/pdf"
                    apiBaseUrl={API} token={localStorage.getItem("token")}
                    onUploadComplete={url => setPdfUrl(url)}
                    onUploadStateChange={v => setIsUploadingPdf(v)}
                  />

                  <button
                    className="btn-amber"
                    style={{ width: "100%", marginTop: 8, padding: 13 }}
                    disabled={isUploadingCover || isUploadingPdf || addingBook}
                  >
                    {addingBook ? <Spinner size={18} /> : (isUploadingCover || isUploadingPdf) ? "Uploading files…" : "Add Book"}
                  </button>
                </form>
              </div>

              {/* Requests Panel */}
              <div className="glass" style={{ padding: 28 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>
                  📋 Book Requests
                </h3>
                {requests.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px 20px" }}>
                    <div style={{ fontSize: 30, marginBottom: 10 }}>🎉</div>
                    <p style={{ color: "#64748b", fontSize: 13 }}>No pending requests</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {requests.map(r => (
                      <div key={r.id} style={{
                        padding: "14px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 12,
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between", gap: 12
                      }}>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>Request</p>
                          <p style={{
                            fontSize: 12, fontFamily: "monospace", color: "#94a3b8",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180
                          }}>{r.id}</p>
                          <p style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            Book: <span style={{ color: "#e2e8f0" }}>{r.bookId}</span>
                          </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                          <span className={`badge badge-${r.status}`}>
                            {r.status === "approved" ? "✓" : r.status === "rejected" ? "✕" : "⏳"} {r.status}
                          </span>
                          {r.status === "pending" && (
                            <button
                              className="btn-outline-amber"
                              onClick={() => approveRequest(r.id)}
                              style={{ padding: "5px 14px", fontSize: 12 }}
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
    </>
  );
}

// ─── Book Card Component ─────────────────────────────────────────────────────
function BookCard({ book, onRequest }) {
  return (
    <div className="book-card">
      {/* Cover */}
      <div style={{
        height: 200, overflow: "hidden",
        background: "linear-gradient(150deg, #0d1f3c, #0b1220)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative"
      }}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 52, opacity: 0.25 }}>📕</span>
        )}
        {/* Availability pill overlay */}
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <span className={`badge ${book.copiesAvailable > 0 ? "badge-avail" : "badge-unavail"}`}
            style={{ fontSize: 10 }}>
            {book.copiesAvailable > 0 ? `${book.copiesAvailable} left` : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 14px 16px" }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.35, marginBottom: 8 }}>{book.title}</h4>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>
          <span style={{ color: "#f59e0b" }}>Author</span>  {book.authors?.join(", ") || "N/A"}
        </p>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>
          <span style={{ color: "#f59e0b" }}>Subject</span>  {book.subjects?.join(", ") || "N/A"}
        </p>
        <p style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>
          <span style={{ color: "#f59e0b" }}>ISBN</span>  {book.isbn || "N/A"}
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn-amber"
            onClick={() => onRequest(book.id)}
            disabled={book.copiesAvailable === 0}
            style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
          >
            Request
          </button>
          {book.ebookKey && (
            <a
              href={book.ebookKey}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-amber"
              style={{ flex: 1, padding: "8px 10px", fontSize: 12 }}
            >
              📄 PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
