"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

export function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const currentFilter = searchParams.get("filter") || "all";

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);

    if (query.trim()) {
      params.set("query", query.trim());
    } else {
      params.delete("query");
    }

    params.delete("cursor"); /* Reset pagination when searching */

    router.push(`/?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams);
    params.delete("query");
    params.delete("cursor");
    router.push(`/?${params.toString()}`);
  };

  const handleFilterChange = (filter: "all" | "mine") => {
    const params = new URLSearchParams(searchParams);

    if (filter === "mine") {
      params.set("filter", "mine");
    } else {
      params.delete("filter");
    }

    params.delete("cursor"); /* Reset pagination when filtering */

    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts and users..."
            className="block w-full pl-12 pr-4 py-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200"
            style={
              {
                "--tw-ring-color": "#C75E30",
              } as React.CSSProperties
            }
            onFocus={(e) => {
              e.target.style.setProperty("--tw-ring-color", "#C75E30");
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => handleFilterChange("all")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentFilter === "all"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          All Posts
        </button>
        <button
          onClick={() => handleFilterChange("mine")}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            currentFilter === "mine"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          My Posts
        </button>
      </div>

      {/* Active Search/Filter Indicator */}
      {(query || currentFilter === "mine") && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>
            {query && `Searching for "${query}"`}
            {query && currentFilter === "mine" && " in "}
            {currentFilter === "mine" && "your posts"}
          </span>
          <button
            onClick={() => {
              setQuery("");
              const params = new URLSearchParams();
              router.push("/");
            }}
            className="text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
