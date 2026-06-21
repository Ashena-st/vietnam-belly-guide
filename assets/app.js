document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });
  }

  document.querySelectorAll("[data-filter-scope]").forEach((scope) => {
    const input = scope.querySelector("[data-search-input]");
    const container = document.querySelector("[data-card-grid]");
    const count = scope.querySelector("[data-result-count]");
    const empty = document.querySelector("[data-empty-state]");
    const letterFilter = scope.querySelector("[data-letter-filter]");
    if (!container) return;

    const items = Array.from(container.children);
    let activeFilter = "all";
    let activeLetter = "all";

    const normalize = (value) =>
      String(value || "")
        .toLowerCase()
        .replace(/œ/g, "oe")
        .replace(/æ/g, "ae")
        .replace(/đ/g, "d")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const getInitial = (item) => {
      const source =
        item.dataset.letter ||
        item.querySelector("td:first-child strong")?.textContent ||
        item.querySelector("td:first-child")?.textContent ||
        item.textContent ||
        "";
      const match = normalize(source).match(/[a-z]/);
      return match ? match[0].toUpperCase() : "#";
    };

    const apply = () => {
      const query = normalize(input?.value || "").trim();
      let shown = 0;

      items.forEach((item) => {
        const haystack = normalize(item.dataset.search || item.textContent || "");
        const region = item.dataset.region || "all";
        const regionMatch = activeFilter === "all" || region === activeFilter;
        const letterMatch = activeLetter === "all" || getInitial(item) === activeLetter;
        const searchMatch = !query || haystack.includes(query);
        const visible = regionMatch && letterMatch && searchMatch;

        item.hidden = !visible;
        if (visible) shown += 1;
      });

      if (count) count.textContent = shown;
      if (empty) empty.hidden = shown !== 0;
    };

    if (letterFilter) {
      const letters = [...new Set(items.map(getInitial))].sort((a, b) =>
        a.localeCompare(b, "fr", { sensitivity: "base" })
      );

      const options = [{ value: "all", label: "Tous" }, ...letters.map((letter) => ({
        value: letter,
        label: letter,
      }))];

      options.forEach(({ value, label }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "alphabet-button";
        button.textContent = label;
        button.dataset.letter = value;
        button.setAttribute("aria-pressed", String(value === "all"));
        if (value === "all") button.classList.add("active");

        button.addEventListener("click", () => {
          activeLetter = value;
          letterFilter.querySelectorAll(".alphabet-button").forEach((otherButton) => {
            const isActive = otherButton.dataset.letter === activeLetter;
            otherButton.classList.toggle("active", isActive);
            otherButton.setAttribute("aria-pressed", String(isActive));
          });
          apply();
        });

        letterFilter.appendChild(button);
      });
    }

    input?.addEventListener("input", apply);
    scope.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        scope.querySelectorAll("[data-filter]").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter;
        apply();
      });
    });

    apply();
  });
});
