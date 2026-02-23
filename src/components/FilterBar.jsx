// FilterBar – dark navy + amber SaaS theme
export default function FilterBar({ filters, setFilters, onSearch, isLoading }) {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    };

    const clearFilters = () => {
        setFilters({ search: "", author: "", subject: "", available: false });
    };

    return (
        <div className="glass" style={{ padding: "20px 24px", marginBottom: 28 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>

                {/* Title */}
                <div style={{ flex: "2 1 200px" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Title
                    </label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: 0.35 }}>🔍</span>
                        <input
                            className="input-field"
                            type="text" name="search"
                            placeholder="Search by title..."
                            value={filters.search}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Author */}
                <div style={{ flex: "1 1 140px" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Author
                    </label>
                    <input
                        className="input-simple"
                        type="text" name="author"
                        placeholder="Filter by author"
                        value={filters.author}
                        onChange={handleChange}
                    />
                </div>

                {/* Subject */}
                <div style={{ flex: "1 1 140px" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Subject
                    </label>
                    <input
                        className="input-simple"
                        type="text" name="subject"
                        placeholder="Filter by subject"
                        value={filters.subject}
                        onChange={handleChange}
                    />
                </div>

                {/* Availability toggle */}
                <div style={{ flex: "0 0 auto", paddingBottom: 1 }}>
                    <label style={{
                        display: "flex", alignItems: "center", gap: 8,
                        cursor: "pointer",
                        padding: "11px 16px",
                        borderRadius: 10,
                        background: filters.available ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${filters.available ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`,
                        transition: "all 0.2s",
                        userSelect: "none"
                    }}>
                        <input
                            type="checkbox" name="available" id="available"
                            checked={filters.available}
                            onChange={handleChange}
                            style={{ width: 14, height: 14, accentColor: "#f59e0b" }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", color: filters.available ? "#f59e0b" : "#64748b" }}>
                            Available only
                        </span>
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div style={{
                display: "flex", justifyContent: "flex-end", alignItems: "center",
                gap: 10, marginTop: 16,
                paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)"
            }}>
                {isLoading && (
                    <span style={{ fontSize: 13, color: "#f59e0b", marginRight: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 14, height: 14, border: "2px solid rgba(245,158,11,0.2)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                        Fetching results…
                    </span>
                )}
                <button className="btn-ghost" onClick={clearFilters} disabled={isLoading}>
                    Reset
                </button>
                <button className="btn-amber" onClick={onSearch} disabled={isLoading} style={{ padding: "9px 20px" }}>
                    {isLoading ? "Searching…" : "Apply Filters"}
                </button>
            </div>
        </div>
    );
}
