const shell = document.querySelector(".site-shell");
const themeButton = document.querySelector("[data-theme-toggle]");
let theme = shell?.dataset.theme || "dark";

function renderTheme() {
  shell.dataset.theme = theme;
  themeButton.textContent = theme === "dark" ? "○" : "◐";
  themeButton.setAttribute("aria-label", theme === "dark" ? "切换到浅色模式" : "切换到暗黑模式");
}

themeButton.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  renderTheme();
});

renderTheme();
