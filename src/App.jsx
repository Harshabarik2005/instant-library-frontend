import { useState, useEffect, useCallback } from "react";
import FilterBar from "./components/FilterBar";
import FileUpload from "./components/FileUpload";
import BookCard from "./components/BookCard";
import StatusBadge from "./components/StatusBadge";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import FormInput from "./components/FormInput";

const API = `${import.meta.env.VITE_API_URL}/api`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

function ToastContainer({ toasts }) {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="font-bold">{icons[t.type]}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ size = 20 }) {
  return <div className="spinner flex-shrink-0" style={{ width: size, height: size }} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
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
  const [activeView, setActiveView] = useState(user?.role === "admin" ? "manage" : "library");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { toasts, addToast } = useToast();

  useEffect(() => { if (user) { fetchBooks(); fetchRequests(); } }, [user]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function login(e) {
    e.preventDefault(); setError(""); setAuthLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); return; }
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setActiveView(data.user.role === "admin" ? "manage" : "library");
      addToast(`Welcome back, ${data.user.name}!`, "success");
    } catch { setError("Could not reach the server."); }
    finally { setAuthLoading(false); }
  }

  function logout() {
    localStorage.removeItem("token");
    setUser(null); setBooks([]); setRequests([]);
    addToast("Logged out.", "info");
  }

  // ── Data ──────────────────────────────────────────────────────────────────
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
    } catch { addToast("Failed to fetch books.", "error"); }
    finally { setBooksLoading(false); }
  }

  async function fetchRequests() {
    const token = localStorage.getItem("token");
    const url = user?.role === "admin" ? `${API}/admin/requests` : `${API}/requests`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { addToast("Failed to load requests.", "error"); }
  }

  async function requestBook(bookId) {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/requests/${bookId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      addToast("Book requested!", "success"); fetchRequests();
    } catch { addToast("Failed to submit request.", "error"); }
  }

  async function approveRequest(id) {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API}/admin/requests/${id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      addToast("Request approved.", "success"); fetchRequests();
    } catch { addToast("Failed to approve.", "error"); }
  }

  async function addBook(e) {
    e.preventDefault(); setAddingBook(true);
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
      const savedTitle = title;
      setTitle(""); setAuthors(""); setSubjects(""); setIsbn(""); setCopies(1);
      setCoverImageUrl(""); setPdfUrl("");
      addToast(`"${savedTitle}" added!`, "success"); fetchBooks();
    } catch { addToast("Failed to add book.", "error"); }
    finally { setAddingBook(false); }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  if (!user) {
    return (
      <>
        <ToastContainer toasts={toasts} />
        <div className="flex min-h-screen overflow-hidden">

          {/* LEFT BRAND PANEL */}
          <div className="hidden md:flex flex-col flex-1 relative bg-zinc-900 p-12 overflow-hidden justify-between">
            {/* Subtle dot pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
            />

            {/* Logo */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg">
                📚
              </div>
              <span className="text-lg font-bold text-white">Instant Library</span>
            </div>

            {/* Hero text */}
            <div className="relative z-10">
              <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight mb-4">
                Search.<br />Borrow.<br />
                <span className="text-zinc-400">Get Access.</span>
              </h1>
              <p className="text-zinc-500 text-base leading-relaxed max-w-sm mb-10">
                Discover books, manage requests, and access digital resources anytime, anywhere.
              </p>
              <div className="flex gap-10">
                {[{ value: "10,000+", label: "BOOKS AVAILABLE" }, { value: "95%", label: "AVAILABILITY RATE" }].map(s => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="text-[10px] text-zinc-500 font-semibold tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-zinc-700 relative z-10">Powered by Greenfield University</p>
          </div>

          {/* RIGHT FORM PANEL */}
          <div className="flex-1 md:flex-none md:w-[480px] flex items-center justify-center px-6 py-12 bg-zinc-50">
            <div className="w-full max-w-sm">
              {/* Mobile logo */}
              <div className="flex items-center gap-2 mb-8 md:hidden">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-sm">📚</div>
                <span className="text-lg font-bold text-zinc-900">Instant Library</span>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
                <h2 className="text-xl font-extrabold text-zinc-900 mb-1 tracking-tight">Sign in</h2>
                <p className="text-sm text-zinc-500 mb-7">Enter your credentials to continue</p>

                <form onSubmit={login} className="flex flex-col gap-4">
                  {/* Email */}
                  <FormInput
                    label="Email"
                    type="email"
                    placeholder="you@greenfield.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    icon="✉"
                  />

                  {/* Password */}
                  <FormInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    icon="🔒"
                  />

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      <span>⚠</span> {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="mt-1 w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold
                      hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2 transition-colors duration-150"
                  >
                    {authLoading ? <Spinner size={18} /> : "Sign In →"}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-zinc-400">
                  Don&apos;t have an account?{" "}
                  <span className="text-zinc-700 font-semibold cursor-pointer hover:underline">Contact your admin</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  const pageTitle = {
    library: "Library Collection",
    requests: user.role === "admin" ? "Book Requests" : "My Requests",
    manage: "Manage Books",
  }[activeView] || "Dashboard";

  return (
    <>
      <ToastContainer toasts={toasts} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <Sidebar
              user={user}
              activeView={activeView}
              setActiveView={v => { setActiveView(v); setSidebarOpen(false); }}
              onLogout={logout}
            />
          </div>
        </div>
      )}

      <div className="page-shell">
        {/* Desktop sidebar */}
        <Sidebar
          user={user}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={logout}
        />

        {/* Main content */}
        <div className="page-content">
          <Navbar
            user={user}
            title={pageTitle}
            onLogout={logout}
            onMenuOpen={() => setSidebarOpen(true)}
          />

          <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">

            {/* ─── STUDENT: Library ─── */}
            {user.role === "student" && activeView === "library" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Available Books</h2>
                  <p className="text-sm text-zinc-500 mt-1">Browse, filter and request books from the library</p>
                </div>

                <FilterBar filters={filters} setFilters={setFilters} onSearch={fetchBooks} isLoading={booksLoading} />

                {booksLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="text-center text-zinc-400">
                      <Spinner size={36} />
                      <p className="text-sm mt-4">Loading books…</p>
                    </div>
                  </div>
                ) : books.length === 0 ? (
                  <div className="empty-state">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-base font-semibold text-zinc-500 mb-1">No books found</p>
                    <p className="text-sm text-zinc-400">Try adjusting your search filters</p>
                  </div>
                ) : (
                  <div className="book-grid">
                    {books.map(book => <BookCard key={book.id} book={book} onRequest={requestBook} />)}
                  </div>
                )}
              </>
            )}

            {/* ─── STUDENT: My Requests ─── */}
            {user.role === "student" && activeView === "requests" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">My Requests</h2>
                  <p className="text-sm text-zinc-500 mt-1">Track the status of your borrow requests</p>
                </div>

                {requests.length === 0 ? (
                  <div className="empty-state">
                    <div className="text-3xl mb-3">📋</div>
                    <p className="text-sm text-zinc-500">You haven&apos;t requested any books yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-w-2xl">
                    {requests.map(r => (
                      <div key={r.id} className="card flex items-center justify-between gap-4 px-5 py-4">
                        <div>
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Book ID</p>
                          <p className="text-sm font-mono text-zinc-700">{r.bookId}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ─── ADMIN: Manage Books ─── */}
            {user.role === "admin" && activeView === "manage" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Manage Books</h2>
                  <p className="text-sm text-zinc-500 mt-1">Add new books to the library catalogue</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  {/* Add Book Form */}
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-base">➕</span>
                      <h3 className="text-base font-bold text-zinc-900">Add New Book</h3>
                    </div>

                    <form onSubmit={addBook} className="flex flex-col gap-4">
                      <FormInput
                        label="Book Title *"
                        placeholder="Enter book title"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                        icon="📖"
                      />
                      <FormInput
                        label="Authors"
                        placeholder="Authors (comma separated)"
                        value={authors}
                        onChange={e => setAuthors(e.target.value)}
                        icon="✍"
                      />
                      <FormInput
                        label="Subjects"
                        placeholder="Subjects (comma separated)"
                        value={subjects}
                        onChange={e => setSubjects(e.target.value)}
                        icon="🏷"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormInput
                          label="ISBN"
                          placeholder="ISBN"
                          value={isbn}
                          onChange={e => setIsbn(e.target.value)}
                        />
                        <FormInput
                          label="Copies"
                          type="number"
                          placeholder="1"
                          value={copies}
                          min="1"
                          onChange={e => setCopies(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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
                      </div>

                      <button
                        type="submit"
                        disabled={isUploadingCover || isUploadingPdf || addingBook}
                        className="mt-2 w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold
                          hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2 transition-colors duration-150"
                      >
                        {addingBook
                          ? <Spinner size={18} />
                          : (isUploadingCover || isUploadingPdf)
                            ? "Uploading…"
                            : "Add Book"}
                      </button>
                    </form>
                  </div>

                  {/* Book list preview */}
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <span className="text-base">📚</span>
                      <h3 className="text-base font-bold text-zinc-900">Catalogue Preview</h3>
                    </div>

                    {books.length === 0 ? (
                      <div className="empty-state" style={{ padding: "32px 20px" }}>
                        <div className="text-3xl mb-3">📭</div>
                        <p className="text-sm text-zinc-400">No books in catalogue yet</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                        {books.map(book => (
                          <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 transition-colors">
                            <div className="w-10 h-12 rounded-lg bg-zinc-100 overflow-hidden flex-shrink-0">
                              {book.coverUrl
                                ? <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-lg opacity-30">📕</div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-900 truncate">{book.title}</p>
                              <p className="text-xs text-zinc-500 truncate">{book.authors?.join(", ") || "Unknown"}</p>
                            </div>
                            <StatusBadge status={book.copiesAvailable > 0 ? "available" : "unavailable"}>
                              {book.copiesAvailable > 0 ? `${book.copiesAvailable} left` : "Out"}
                            </StatusBadge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ─── ADMIN: Book Requests ─── */}
            {user.role === "admin" && activeView === "requests" && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Book Requests</h2>
                  <p className="text-sm text-zinc-500 mt-1">Review and approve student borrow requests</p>
                </div>

                {requests.length === 0 ? (
                  <div className="empty-state max-w-lg">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-base font-semibold text-zinc-500 mb-1">All clear!</p>
                    <p className="text-sm text-zinc-400">No pending requests at the moment.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-w-3xl">
                    {requests.map(r => (
                      <div key={r.id} className="card flex items-center justify-between gap-4 px-5 py-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Request ID</p>
                          <p className="text-xs font-mono text-zinc-600 truncate max-w-[220px]">{r.id}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            Book: <span className="font-medium text-zinc-700">{r.bookId}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <StatusBadge status={r.status} />
                          {r.status === "pending" && (
                            <button
                              onClick={() => approveRequest(r.id)}
                              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700
                                hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors duration-150"
                            >
                              ✓ Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </main>
        </div>
      </div>
    </>
  );
}
