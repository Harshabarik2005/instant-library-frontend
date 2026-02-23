export default function FilterBar({ filters, setFilters, onSearch, isLoading }) {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const clearFilters = () => {
        setFilters({ search: "", author: "", subject: "", available: false });
    };

    return (
        <div style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "28px"
        }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
                {/* Title Search */}
                <div style={{ flex: "2 1 200px", minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--muted)", marginBottom: "6px" }}>
                        🔍 Title
                    </label>
                    <input
                        className="input-dark"
                        type="text"
                        name="search"
                        placeholder="Search by title..."
                        value={filters.search}
                        onChange={handleChange}
                    />
                </div>

                {/* Author */}
                <div style={{ flex: "1 1 140px", minWidth: "130px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--muted)", marginBottom: "6px" }}>
                        ✍️ Author
                    </label>
                    <input
                        className="input-dark"
                        type="text"
                        name="author"
                        placeholder="Filter by author"
                        value={filters.author}
                        onChange={handleChange}
                    />
                </div>

                {/* Subject */}
                <div style={{ flex: "1 1 140px", minWidth: "130px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--muted)", marginBottom: "6px" }}>
                        📂 Subject
                    </label>
                    <input
                        className="input-dark"
                        type="text"
                        name="subject"
                        placeholder="Filter by subject"
                        value={filters.subject}
                        onChange={handleChange}
                    />
                </div>

                {/* Available Only Checkbox */}
                <div style={{ flex: "0 0 auto", paddingBottom: "2px" }}>
                    <label style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        cursor: "pointer", padding: "10px 16px",
                        background: filters.available ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${filters.available ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: "10px",
                        transition: "all 0.2s",
                        userSelect: "none"
                    }}>
                        <input
                            type="checkbox"
                            name="available"
                            id="available"
                            checked={filters.available}
                            onChange={handleChange}
                            style={{ width: "14px", height: "14px", accentColor: "#7c3aed" }}
                        />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: filters.available ? "#c4b5fd" : "var(--muted)", whiteSpace: "nowrap" }}>
                            Available only
                        </span>
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{
                display: "flex", justifyContent: "flex-end", alignItems: "center",
                gap: "10px", marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.07)"
            }}>
                {isLoading && (
                    <span style={{ fontSize: "13px", color: "var(--accent-light)", marginRight: "auto" }}>
                        ⏳ Fetching results...
                    </span>
                )}
                <button className="btn-secondary" onClick={clearFilters} disabled={isLoading}>
                    Reset
                </button>
                <button className="btn-primary" onClick={onSearch} disabled={isLoading}>
                    {isLoading ? "Searching..." : "Apply Filters"}
                </button>
            </div>
        </div>
    );
}
