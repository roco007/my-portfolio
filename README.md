# Raj Colaco // Full-Stack Engineer & AI Systems Architect

> **Interactive Developer Portfolio** crafted with React 19, TypeScript, Vite, Anime.js 4, and Modern CSS.

Live URL: [https://roco007.github.io/my-portfolio/](https://roco007.github.io/my-portfolio/)

---

## ⚡ Overview

An interactive digital portfolio designed for engineering leaders, technical recruiters, and developers. Built from the ground up to replace generic templates with a tactile, cybernetic product experience:

- **Choreographed Motion:** Powered by **Anime.js 4.5.0** (timeline hero entrance, scroll-triggered reveals, 3D card tilt with specular glare, text scramble decryption).
- **Interactive Developer CLI Terminal:** A functional command HUD accessible via navbar, floating dock, or `Ctrl + \`` supporting `/help`, `/about`, `/skills`, `/projects`, `/theme`, and `/contact`.
- **Theme Manager:** Persistent Dark & Light modes with dynamic contrast tokens and system preference synchronization.
- **Project Showcase:** 14 verified production systems across Multi-Agent AI, Developer Utilities, and 3D simulations with searchable filters and deep-dive technical specs.
- **Accessibility & Motion Compliance:** Full `prefers-reduced-motion: reduce` degradation, keyboard navigation, skip-to-content links, and WCAG AA contrast.
- **SEO & Social Metadata:** JSON-LD structured schema, OpenGraph tags, Twitter Card metadata, and canonical URL mapping.

---

## 🛠 Technology Stack

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server:** [Vite 6](https://vitejs.dev/)
- **Animation Engine:** [Anime.js 4](https://animejs.com/) (`animate`, `createTimeline`, `stagger`)
- **Styling Architecture:** Modern Scoped CSS Modules + CSS Custom Properties Design System
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** GitHub Pages / Vercel (Configured with relative base `./` for zero path breakages)

---

## 📁 Project Structure

```text
my-portfolio/
├── .github/
│   └── workflows/
│       └── deploy.yml        # Automated GitHub Pages CI/CD workflow
├── public/
│   ├── favicon.svg           # High-resolution vector favicon
│   ├── favicon.ico           # Legacy ICO favicon
│   └── images/               # Production preview screenshots for all 14 projects
├── src/
│   ├── animations/
│   │   ├── entrance.ts       # Hero choreographed timeline entrance
│   │   ├── scroll.ts         # IntersectionObserver scroll reveal engine
│   │   ├── interactions.ts   # 3D card tilt, specular glare & text scramble
│   │   └── useReducedMotion.ts # React hook for accessibility preferences
│   ├── components/
│   │   ├── AmbientCanvas.tsx # Lightweight interactive node/particle mesh
│   │   ├── Button.tsx        # Tactile multi-variant button with microinteractions
│   │   ├── DeveloperTerminal.tsx # Floating interactive CLI command HUD
│   │   ├── Navbar.tsx        # Scroll-progress, active section tracking & mobile drawer
│   │   ├── ProjectCard.tsx   # 3D card tilt, tech tags & deep-dive spec modal
│   │   ├── SectionHeading.tsx# Tag indicator & editorial headline component
│   │   └── ThemeToggle.tsx   # Smooth animated dark/light mode toggle
│   ├── data/
│   │   └── portfolio.ts      # Centralized source of truth for all content
│   ├── sections/
│   │   ├── Hero.tsx          # Dynamic headline, telemetry stats & CTAs
│   │   ├── About.tsx         # Engineering pillars & architecture specifications
│   │   ├── Skills.tsx        # Categorized capability radar with domain filters
│   │   ├── Projects.tsx      # Filterable project archive with search input
│   │   ├── Experience.tsx    # Vertical luminous track timeline
│   │   ├── Contact.tsx       # Direct uplink, email copy & message composer
│   │   └── Footer.tsx        # System status, channel uplinks & back-to-top
│   ├── styles/
│   │   ├── tokens.css        # Color palette, spacing, radii, typography tokens
│   │   ├── animations.css    # Keyframe utilities & reduced-motion overrides
│   │   └── globals.css       # Base CSS reset, typography & focus indicators
│   ├── App.tsx               # Main layout coordinator & terminal state
│   ├── main.tsx              # React DOM mounting
│   └── vite-env.d.ts         # Vite & CSS module type declarations
├── index.html                # HTML5 entry with SEO tags, fonts & JSON-LD
├── package.json              # Scripts & dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration with relative base './'
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **npm**: v9.0.0 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/roco007/my-portfolio.git
cd my-portfolio

# Install dependencies
npm install
```

### Local Development

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Visit `http://localhost:3000/` in your browser.

### Production Build

Typecheck and generate the optimized production bundle in `dist/`:

```bash
npm run build
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

---

## ⚙️ How to Update Portfolio Content

All personal details, skills, projects, and work history live in **`src/data/portfolio.ts`**. You do not need to rewrite UI components to change content.

### 1. Adding a New Project

Open `src/data/portfolio.ts` and add an object to the `PROJECTS` array:

```typescript
{
  id: 'my-new-tool',
  title: 'My New Tool',
  category: 'ai', // 'ai' | 'utility' | 'interactive'
  categoryLabel: 'AI & Multi-Agent',
  description: 'Concise 1-2 sentence description of what the project does.',
  problemSolved: 'The specific problem or bottleneck this tool eliminates.',
  keyFeatures: [
    'Real-time streaming feedback',
    'Offline client-side AST processing',
    'One-click GitHub webhook sync'
  ],
  technologies: ['TypeScript', 'React 19', 'Next.js', 'Tailwind CSS'],
  githubUrl: 'https://github.com/roco007/my-new-tool',
  liveUrl: 'https://my-new-tool.vercel.app', // optional
  image: 'images/my-tool-preview.webp',      // place file in public/images/
  sysId: 'SYS.015',
  featured: true
}
```

### 2. Updating Skills

Modify the `SKILL_CATEGORIES` list in `src/data/portfolio.ts`:

```typescript
{
  id: 'ai-agents',
  title: 'AI Systems & Multi-Agent Architecture',
  description: 'Autonomous reasoning pipelines...',
  skills: [
    { name: 'Multi-Agent Evaluation', highlight: true },
    { name: 'Google Gemini 2.5 / 3.5 Pro & Flash', highlight: true },
    // Add new skill:
    { name: 'LangGraph Workflows', highlight: true }
  ]
}
```

### 3. Customizing Theme Colors & Tokens

Open `src/styles/tokens.css` to adjust color variables:
- Dark mode: Edit values under `:root`
- Light mode: Edit values under `[data-theme='light']`

### 4. Customizing Animations

Anime.js animations are encapsulated inside `src/animations/`:
- `src/animations/entrance.ts`: Adjust durations, delays, and easings for the hero cascade.
- `src/animations/scroll.ts`: Adjust IntersectionObserver threshold, rootMargin, and reveal translations.
- `src/animations/interactions.ts`: Adjust 3D card tilt rotation angles (`targetRotateX`, `targetRotateY`) or text scramble character sets.

---

## 🚢 Deployment

### GitHub Pages (Automated via GitHub Actions)

The repository includes `.github/workflows/deploy.yml`. When you push to `main` (or trigger via `workflow_dispatch`), GitHub Actions will:
1. Check out code and set up Node 22.
2. Run `npm ci` and `npm run build`.
3. Upload and deploy `dist/` directly to GitHub Pages.

To enable GitHub Pages in your repository:
1. Go to **Settings > Pages** in your GitHub repo.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push to `main` to trigger the automatic build and deploy.

### Vercel / Cloudflare Pages / Netlify

Because `vite.config.ts` uses `base: './'`, you can also deploy anywhere with standard static settings:
- **Build command**: `npm run build`
- **Output directory**: `dist`
