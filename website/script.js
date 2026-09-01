const shell = document.querySelector(".site-shell");
const themeButton = document.querySelector("[data-theme-toggle]");
const languageButton = document.querySelector("[data-language-toggle]");
const translatedElements = [...document.querySelectorAll("[data-i18n-en]")];
const translatedImages = [...document.querySelectorAll("[data-alt-en]")];
const themeImages = [...document.querySelectorAll("[data-light-src][data-dark-src]")];
const translatedAriaElements = [...document.querySelectorAll("[data-aria-en]")];
const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
const observedSections = [...document.querySelectorAll("[data-observe-section]")];

let theme = localStorage.getItem("wutong-theme") || "light";
let language = localStorage.getItem("wutong-language") || "zh";

translatedElements.forEach((element) => {
  element.dataset.i18nZh = element.innerHTML;
});

translatedImages.forEach((image) => {
  image.dataset.altZh = image.alt;
});

translatedAriaElements.forEach((element) => {
  element.dataset.ariaZh = element.getAttribute("aria-label");
});

function renderTheme() {
  shell.dataset.theme = theme;
  themeImages.forEach((image) => {
    image.src = theme === "dark" ? image.dataset.darkSrc : image.dataset.lightSrc;
  });
  const isEnglish = language === "en";
  const themeLabel = theme === "light"
    ? (isEnglish ? "Switch to dark mode" : "切换到暗黑模式")
    : (isEnglish ? "Switch to light mode" : "切换到明亮模式");
  themeButton.setAttribute("aria-label", themeLabel);
  localStorage.setItem("wutong-theme", theme);
}

function renderLanguage() {
  const isEnglish = language === "en";
  document.documentElement.lang = isEnglish ? "en" : "zh-CN";
  document.title = isEnglish ? "Elle Wu | Product Manager Portfolio" : "吴桐 | 产品经理作品集";

  translatedElements.forEach((element) => {
    element.innerHTML = isEnglish ? element.dataset.i18nEn : element.dataset.i18nZh;
  });

  translatedImages.forEach((image) => {
    image.alt = isEnglish ? image.dataset.altEn : image.dataset.altZh;
  });

  translatedAriaElements.forEach((element) => {
    element.setAttribute("aria-label", isEnglish ? element.dataset.ariaEn : element.dataset.ariaZh);
  });

  languageButton.textContent = isEnglish ? "中" : "EN";
  languageButton.setAttribute("aria-label", isEnglish ? "切换到中文" : "Switch to English");
  localStorage.setItem("wutong-language", language);
  renderTheme();
}

themeButton.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  renderTheme();
});

languageButton.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  renderLanguage();
});

function setActiveSection(sectionId) {
  sectionLinks.forEach((link) => {
    const isActive = link.dataset.sectionLink === sectionId;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "true");
    else link.removeAttribute("aria-current");
  });
}

let scrollFrame;

function updateSectionFromScroll() {
  const readingLine = window.innerHeight * 0.42;
  let activeSection = observedSections[0]?.id;

  observedSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= readingLine) activeSection = section.id;
  });

  if (activeSection) setActiveSection(activeSection);
}

function queueSectionUpdate() {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateSectionFromScroll();
    scrollFrame = null;
  });
}

window.addEventListener("scroll", queueSectionUpdate, { passive: true });
window.addEventListener("resize", queueSectionUpdate);
sectionLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveSection(link.dataset.sectionLink));
});

renderTheme();
renderLanguage();
updateSectionFromScroll();
