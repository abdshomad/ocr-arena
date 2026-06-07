/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";

export function useHistoryHandlers(state: any) {
  const {
    theme,
    setTheme,
    tokenInput,
    setIsAuthenticated,
    setLoginError,
    setHistoryList,
    setSelectedItems,
    selectedItems,
    setLoading
  } = state;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history?all=true");
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data.history || []);
      } else {
        console.error("Failed to load history list");
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput === "demo") {
      setIsAuthenticated(true);
      sessionStorage.setItem("doc_parser_token", "demo");
    } else {
      setLoginError("Invalid access token. Please try again.");
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete scan history for ${filename}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename })
      });

      if (res.ok) {
        setHistoryList((prev: any[]) => prev.filter((item) => item.filename !== filename));
        setSelectedItems((prev: any[]) => prev.filter((f) => f !== filename));
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete request failed:", err);
      alert("Failed to delete history from server.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    if (!window.confirm(`Delete scan history for the ${selectedItems.length} selected items?`)) {
      return;
    }

    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filenames: selectedItems })
      });

      if (res.ok) {
        const deletedSet = new Set(selectedItems);
        setHistoryList((prev: any[]) => prev.filter((item) => !deletedSet.has(item.filename)));
        setSelectedItems([]);
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Delete request failed:", err);
      alert("Failed to delete history from server.");
    }
  };

  // Effects
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme as "light" | "dark");
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (sessionStorage.getItem("doc_parser_token") === "demo") {
      setIsAuthenticated(true);
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get("token") === "demo") {
        setIsAuthenticated(true);
        sessionStorage.setItem("doc_parser_token", "demo");
      }
    }
  }, []);

  React.useEffect(() => {
    if (state.isAuthenticated) {
      fetchHistory();
    }
  }, [state.isAuthenticated]);

  React.useEffect(() => {
    if (!state.previewItem) {
      state.setPreviewMarkdown("");
      state.setPreviewRawResult(null);
      return;
    }
    
    const fetchPreview = async () => {
      state.setLoadingPreview(true);
      try {
        const res = await fetch(`/api/history?file=${encodeURIComponent(state.previewItem.filename)}&engine=${encodeURIComponent(state.previewItem.engine)}`);
        if (res.ok) {
          const data = await res.json();
          const markdownText = data.result?.layoutParsingResults?.[0]?.markdown?.text || "";
          state.setPreviewMarkdown(markdownText);
          state.setPreviewRawResult(data.result);
        } else {
          state.setPreviewMarkdown("Failed to load parsed text.");
          state.setPreviewRawResult(null);
        }
      } catch (err) {
        console.error("Error fetching preview details:", err);
        state.setPreviewMarkdown("Failed to load parsed text.");
        state.setPreviewRawResult(null);
      } finally {
        state.setLoadingPreview(false);
      }
    };
    
    fetchPreview();
  }, [state.previewItem]);

  return {
    fetchHistory,
    toggleTheme,
    handleLogin,
    handleDelete,
    handleDeleteSelected
  };
}
