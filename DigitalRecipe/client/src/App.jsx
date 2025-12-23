import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const defaultForm = {
  title: "",
  ingredients: "",
  steps: "",
  creator: "",
};

const parseList = (text) =>
  text
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const parseSteps = (text) =>
  text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatDate = (timestamp) =>
  new Date(timestamp * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, options);
  let data = {};
  try {
    data = await response.json();
  } catch {
    // ignore bodyless responses
  }
  if (!response.ok) {
    throw new Error(data.error || data.message || "Request failed");
  }
  return data;
};

const RecipeCard = ({ recipe, onVerify, verifying }) => {
  return (
    <article className="recipe-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">Recipe #{recipe.index}</p>
          <h3>{recipe.title}</h3>
        </div>
      </div>

      <p className="card-meta">
        Created by <strong>{recipe.creator}</strong> • {formatDate(recipe.timestamp)}
      </p>

      <div className="card-grid">
        <div>
          <h4>Ingredients</h4>
          <ul>
            {recipe.ingredients.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Steps</h4>
          <ol>
            {recipe.steps.map((step, idx) => (
              <li key={`${step}-${idx}`}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card-actions">
        <button className="ghost" onClick={() => onVerify(recipe.index)} disabled={verifying}>
          {verifying ? "Checking…" : "Check recipe record"}
        </button>
      </div>
    </article>
  );
};

function App() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(defaultForm);
  const [formStatus, setFormStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyingIndex, setVerifyingIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return recipes;
    return recipes.filter((recipe) => {
      const haystack = `${recipe.title} ${recipe.creator}`.toLowerCase();
      return haystack.includes(searchQuery.trim().toLowerCase());
    });
  }, [recipes, searchQuery]);

  async function fetchRecipes() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/recipes");
      setRecipes(data);
    } catch (err) {
      setError(err.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      title: form.title.trim(),
      ingredients: parseList(form.ingredients),
      steps: parseSteps(form.steps),
      creator: form.creator.trim(),
    };

    if (!payload.title || !payload.creator || !payload.ingredients.length || !payload.steps.length) {
      setFormStatus({ type: "error", message: "Please fill in every field before submitting." });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ type: "info", message: "Saving your recipe..." });

    try {
      await apiFetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setForm(defaultForm);
      setFormStatus({ type: "success", message: "Recipe saved successfully." });
      fetchRecipes();
    } catch (err) {
      setFormStatus({ type: "error", message: err.message || "Failed to add recipe." });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(index) {
    setVerifyingIndex(index);
    try {
      const result = await apiFetch(`/api/recipes/${index}/verify`);
      setToast({
        type: result.valid ? "success" : "error",
        message: `Recipe #${index}: ${result.message}`,
      });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Unable to verify recipe." });
    } finally {
      setVerifyingIndex(null);
    }
  }

  const stats = [
    { label: "Total recipes", value: recipes.length || "—" },
  ];

  return (
    <div className="app-shell">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}

      <header className="hero">
        <div>
          <p className="eyebrow accent">Digital Recipe Book</p>
          <h1>Save and share your favorite recipes in one simple place.</h1>
          <p className="hero-subtitle">
            Add recipes, search them quickly, and keep all your cooking ideas organized with an easy interface.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={fetchRecipes}>
              Refresh recipes
            </button>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <p className="label">{stat.label}</p>
            <h2>{stat.value}</h2>
          </div>
        ))}
      </section>

      <section className="content-grid">
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Add a recipe</p>
              <h2>Create a new recipe</h2>
            </div>
            <p className="muted">Fields support comma or newline separated lists.</p>
          </div>

          <label>
            Recipe title
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
              placeholder="Midnight ramen noodles"
            />
          </label>

          <label>
            Creator name or ID
            <input
              type="text"
              value={form.creator}
              onChange={(event) => updateForm("creator", event.target.value)}
              placeholder="Chef Satoshi"
            />
          </label>

          <label>
            Ingredients
            <textarea
              value={form.ingredients}
              onChange={(event) => updateForm("ingredients", event.target.value)}
              rows={4}
              placeholder="3 cups stock&#10;Fresh ramen noodles&#10;Soft egg"
            />
          </label>

          <label>
            Steps
            <textarea
              value={form.steps}
              onChange={(event) => updateForm("steps", event.target.value)}
              rows={5}
              placeholder="Simmer broth&#10;Cook noodles&#10;Assemble bowl"
            />
          </label>

          {formStatus && <p className={`status-pill ${formStatus.type}`}>{formStatus.message}</p>}

          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save recipe"}
          </button>
        </form>

        <div className="panel list-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Stored recipes</p>
              <h2>Browse recipes</h2>
            </div>
            <input
              type="search"
              placeholder="Search by recipe or creator"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {error && <p className="status-pill error">{error}</p>}
          {loading ? (
            <div className="loader">
              <span />
              Loading recipes...
            </div>
          ) : filteredRecipes.length === 0 ? (
            <p className="muted empty-state">
              {recipes.length ? "No recipes match your search." : "No recipes yet. Be the first to add one!"}
            </p>
          ) : (
            <div className="recipes-grid">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.hash}
                  recipe={recipe}
                  onVerify={handleVerify}
                  verifying={verifyingIndex === recipe.index}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
