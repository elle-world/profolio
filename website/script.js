const copy = {
  zh: {
    "nav.profile": "Profile",
    "nav.works": "Works",
    "nav.resume": "Resume",
    "actions.resume": "下载简历",
    "actions.works": "查看作品",
    "actions.contact": "联系我",
    "hero.eyebrow": "Wu Tong / Estelle Wu",
    "hero.title": "Product Manager with design roots.",
    "hero.lede": "我是一名拥有工业设计和 UI 设计背景的 C 端产品经理，关注用户体验、产品叙事，以及 AI 如何提升从想法到原型的效率。",
    "hero.statusLabel": "Current focus",
    "hero.status": "C-end product · Fund & payment · AI-assisted workflow",
    "profile.title": "把设计审美、用户同理心和产品落地连接起来。",
    "profile.body": "我的经历从工业设计和 UI 设计开始，后来进入 C 端产品管理。目前在支付领域做基金相关的用户产品。我关心复杂信息如何被普通用户理解，也在用 AI 辅助完成研究、写作、原型和 Web coding，把产品想法更快变成可体验的版本。",
    "capabilities.product": "从用户问题、业务约束和体验路径出发，拆解产品机会。",
    "capabilities.visual": "设计背景让我对排版、层级、节奏和界面细节保持敏感。",
    "capabilities.empathy": "长期关注普通用户在复杂场景中的理解成本和决策压力。",
    "capabilities.ai": "用 AI 辅助调研、构思、写作和编码，让想法更快进入验证。",
    "works.title": "先发布，再迭代的作品系统。",
    "works.body": "第一期先让网站和作品方向真实上线。后续每个子项目都会按“构思、发布、迭代”的方式持续完善。",
    "works.portfolio": "这个网站本身就是第一个 Web coding 作品，用 AI 辅助完成定位、内容结构、视觉方向和前端落地。",
    "works.fund": "结合基金和支付产品经验，探索如何用 AI 帮助普通用户理解基金波动、风险和复杂金融信息。",
    "works.teardown": "拆解 AI 产品的用户路径、AI 介入点、失败场景和可优化体验，沉淀产品判断力。",
    "process.title": "我的作品迭代方式",
    "process.frame": "先讨论问题、用户、场景和作品想证明的能力。",
    "process.ship": "做出一个可以被打开、被体验、被评价的版本。",
    "process.iterate": "根据反馈补充内容、交互、视觉和案例深度。",
    "resume.title": "简历作为正式背景，作品作为能力证据。",
    "resume.body": "我的正式经历集中在 C 端产品、支付/基金相关用户产品、UI 设计和工业设计。网站会持续补充作品，展示我如何把这些经验迁移到更 AI-native 的工作方式里。",
    "personal.title": "一个持续观察人与系统的人。",
    "personal.body": "旅行和自媒体会作为个人侧面出现，但不会抢走求职主线。它们更像我观察服务、城市、消费体验和普通人需求的入口。",
    "contact.title": "如果你想了解我的产品经历或作品，可以从这里开始。"
  },
  en: {
    "nav.profile": "Profile",
    "nav.works": "Works",
    "nav.resume": "Resume",
    "actions.resume": "Download resume",
    "actions.works": "View works",
    "actions.contact": "Contact",
    "hero.eyebrow": "Wu Tong / Estelle Wu",
    "hero.title": "Product Manager with design roots.",
    "hero.lede": "I bring industrial design roots, UI experience, and C-end product practice into thoughtful consumer experiences and AI-assisted building.",
    "hero.statusLabel": "Current focus",
    "hero.status": "C-end product · Fund & payment · AI-assisted workflow",
    "profile.title": "Connecting visual taste, user empathy, and product execution.",
    "profile.body": "My path started with industrial design and UI design, then moved into C-end product management. I currently work on fund-related user products in the payment field. I care about how ordinary users understand complex information, and I use AI to support research, writing, prototyping, and web coding.",
    "capabilities.product": "I frame opportunities through user problems, business constraints, and experience flows.",
    "capabilities.visual": "My design background keeps me sensitive to hierarchy, rhythm, layout, and interface details.",
    "capabilities.empathy": "I pay attention to the cognitive load and decision pressure users face in complex scenarios.",
    "capabilities.ai": "I use AI to support research, ideation, writing, and coding so ideas become testable faster.",
    "works.title": "A portfolio system built by shipping first and iterating next.",
    "works.body": "The first version makes the site and work directions real. Each work will evolve through framing, shipping, and iteration.",
    "works.portfolio": "This website is the first web coding work, using AI to support positioning, content structure, visual direction, and implementation.",
    "works.fund": "A concept that connects fund and payment product experience with AI-assisted explanations for ordinary users.",
    "works.teardown": "A structured library for analyzing AI product flows, AI touchpoints, failure cases, and UX improvements.",
    "process.title": "How I build portfolio works",
    "process.frame": "Clarify the problem, user, scenario, and capability the work should prove.",
    "process.ship": "Create something people can open, experience, and react to.",
    "process.iterate": "Use feedback to deepen content, interaction, visual detail, and case quality.",
    "resume.title": "Resume for formal background, works for evidence.",
    "resume.body": "My formal experience spans C-end product work, fund and payment-related user products, UI design, and industrial design. This site will keep adding works that show how these strengths extend into AI-assisted product practice.",
    "personal.title": "A person who observes people and systems.",
    "personal.body": "Travel and creator links will appear as personal context, not the main storyline. They reflect how I observe services, cities, consumer experiences, and everyday needs.",
    "contact.title": "Start here if you want to learn more about my product work."
  }
};

const shell = document.querySelector(".site-shell");
const langButton = document.querySelector("[data-lang-toggle]");
const themeButton = document.querySelector("[data-theme-toggle]");
let language = "zh";
let theme = "light";

function renderLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (key && copy[language][key]) {
      node.textContent = copy[language][key];
    }
  });
  langButton.textContent = language === "zh" ? "EN" : "中文";
}

function renderTheme() {
  shell.dataset.theme = theme;
  themeButton.textContent = theme === "light" ? "◐" : "○";
  themeButton.setAttribute("aria-label", theme === "light" ? "切换到暗黑模式" : "切换到浅色模式");
}

langButton.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  renderLanguage();
});

themeButton.addEventListener("click", () => {
  theme = theme === "light" ? "dark" : "light";
  renderTheme();
});

renderLanguage();
renderTheme();
