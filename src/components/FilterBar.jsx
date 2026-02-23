// src/components/FilterBar.jsx
export default function FilterBar({ filters, setFilters, onSearch, isLoading }) {
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            author: "",
            subject: "",
            available: false,
        });
        // Let parent know we cleared so it can fetch the fresh list if it wants
        // or parent can use useEffect on filters, but explicit search is safer.
    };

    return (
        <div className="bg-white p-4 rounded shadow mb-6 w-full border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        type="text"
                        name="search"
                        placeholder="Search by title..."
                        value={filters.search}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                    <input
                        type="text"
                        name="author"
                        placeholder="Filter by author"
                        value={filters.author}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                        type="text"
                        name="subject"
                        placeholder="Filter by subject"
                        value={filters.subject}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                </div>

                <div className="w-full md:w-auto flex items-center mb-2">
                    <input
                        type="checkbox"
                        name="available"
                        id="available"
                        checked={filters.available}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="available" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                        Available only
                    </label>
                </div>
            </div>

            <div className="mt-4 flex gap-3 justify-end items-center border-t border-gray-100 pt-4">
                {isLoading && <span className="text-sm text-blue-600 animate-pulse">Fetching results...</span>}
                <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    disabled={isLoading}
                >
                    Reset
                </button>
                <button
                    onClick={onSearch}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    disabled={isLoading}
                >
                    {isLoading ? 'Searching...' : 'Apply Filters'}
                </button>
            </div>
        </div>
    );
}
