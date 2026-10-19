export interface PersonalInfo {
  name: string;
  role: string;
  tagline: string;
  headline: string;
  bio: string[];
  location: string;
  email: string;
  availableForHire: boolean;
  status: string;
  stats: {
    deployedProjects: number;
    openSourceRepos: number;
    primaryStack: string;
    yearsOfExperience: string;
  };
}

export interface SocialLink {
  platform: 'github' | 'linkedin' | 'x' | 'instagram' | 'telegram' | 'whatsapp' | 'email';
  name: string;
  url: string;
  handle: string;
}

export type ProjectCategory = 'all' | 'ai' | 'utility' | 'interactive';

export interface Project {
  id: string;
  title: string;
  category: 'ai' | 'utility' | 'interactive';
  categoryLabel: string;
  description: string;
  problemSolved: string;
  keyFeatures: string[];
  technologies: string[];
  githubUrl: string;
  liveUrl?: string;
  image: string;
  sysId: string;
  featured: boolean;
}

export interface SkillCategory {
  id: string;
  title: string;
  description: string;
  skills: {
    name: string;
    highlight?: boolean;
    level?: string;
  }[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  location?: string;
  globeLocation: {
    latitude: number;
    longitude: number;
    label: string;
    isRemote?: boolean;
  };
  summary: string;
  achievements: string[];
  technologies: string[];
}

export const PERSONAL_INFO: PersonalInfo = {
  name: 'Raj Colaco',
  role: 'Full-Stack Engineer & AI Systems Architect',
  tagline: 'Architecting Autonomous Systems, Developer Engines & Immersive Web Experiences',
  headline: 'Engineering the next frontier of intelligence with tactile code & deliberate motion.',
  bio: [
    'I am a Software Engineer focused on crafting high-leverage developer utilities, multi-agent AI evaluation systems, and modern, high-performance web applications.',
    'My work bridges frontier AI intelligence—leveraging Google Gemini 2.5/3.5 models, agentic workflows, and code AST analysis—with robust, offline-first client-side architecture in React 19, TypeScript, Next.js, and Node.js.',
    'With 14+ deployed production units and 34 public repositories, I prioritize privacy-first client processing, snappy zero-layout-shift microinteractions, and scalable system design.'
  ],
  location: 'Vasai West, Mumbai Metropolitan Region, India',
  email: 'raj45colaco@gmail.com',
  availableForHire: true,
  status: 'SYS.ONLINE // READY FOR NEW DEPLOYMENTS',
  stats: {
    deployedProjects: 14,
    openSourceRepos: 34,
    primaryStack: 'TypeScript / React / AI',
    yearsOfExperience: '5+ Years'
  }
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'github',
    name: 'GitHub',
    url: 'https://github.com/roco007',
    handle: '@roco007'
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/raj-colaco/',
    handle: 'in/raj-colaco'
  },
  {
    platform: 'x',
    name: 'X (Twitter)',
    url: 'https://x.com/rococolaco',
    handle: '@rococolaco'
  },
  {
    platform: 'email',
    name: 'Email',
    url: 'mailto:raj45colaco@gmail.com',
    handle: 'raj45colaco@gmail.com'
  },
  {
    platform: 'telegram',
    name: 'Telegram',
    url: 'https://t.me/919673179079?text=Hello,%20I%20am%20reaching%20out%20to%20you%20from%20your%20website.',
    handle: '+91 9673179079'
  },
  {
    platform: 'whatsapp',
    name: 'WhatsApp',
    url: 'https://wa.me/919673179079?text=Hello,%20I%20am%20reaching%20out%20to%20you%20from%20your%20website.',
    handle: '+91 9673179079'
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/roco_colaco/',
    handle: '@roco_colaco'
  }
];

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: 'ai-agents',
    title: 'AI Systems & Multi-Agent Architecture',
    description: 'Autonomous reasoning pipelines, prompt engineering, and LLM evaluation architectures.',
    skills: [
      { name: 'Multi-Agent Evaluation', highlight: true },
      { name: 'Google Gemini 2.5 / 3.5 Pro & Flash', highlight: true },
      { name: 'LLM Orchestration', highlight: true },
      { name: 'AST & Code Synthesis' },
      { name: 'RAG Architecture' },
      { name: 'Agentic Tool Calling' },
      { name: 'Prompt Engineering & Fine-tuning' },
      { name: 'Synthetic Dataset Gen' }
    ]
  },
  {
    id: 'frontend',
    title: 'Frontend Engineering & Creative UI',
    description: 'Component architecture, reactive state, and high-performance interactive graphics.',
    skills: [
      { name: 'TypeScript', highlight: true },
      { name: 'React 19 / Next.js 15 & 16', highlight: true },
      { name: 'Anime.js Animation Engine', highlight: true },
      { name: 'Tailwind CSS v4' },
      { name: 'Modern Vanilla CSS / Variables' },
      { name: 'HTML5 Semantic / A11y' },
      { name: 'Three.js / WebGL / Canvas' },
      { name: 'Vite / Bundler Tooling' }
    ]
  },
  {
    id: 'backend',
    title: 'Backend Systems & API Architecture',
    description: 'Scalable services, data layers, and high-throughput application protocols.',
    skills: [
      { name: 'Node.js / Express', highlight: true },
      { name: 'Python / FastAPI', highlight: true },
      { name: 'tRPC 11' },
      { name: 'RESTful API Design' },
      { name: 'GitHub Webhooks & REST API' },
      { name: 'Drizzle ORM' },
      { name: 'WebSocket Streaming' },
      { name: 'Microservice Design' }
    ]
  },
  {
    id: 'data-infra',
    title: 'Databases & Developer Tooling',
    description: 'Relational databases, developer developer productivity, and CI/CD pipelines.',
    skills: [
      { name: 'PostgreSQL & MySQL', highlight: true },
      { name: 'SQLite (Local / Embedded)' },
      { name: 'Redis Caching' },
      { name: 'Git & GitHub Actions CI/CD', highlight: true },
      { name: 'Linux / POSIX Shell' },
      { name: 'Vercel / Cloudflare Deployment' },
      { name: 'AST Parsers & Compilers' },
      { name: 'Core Web Vitals Optimization' }
    ]
  }
];

export const PROJECTS: Project[] = [
  {
    id: 'docurelease-ai',
    title: 'DocuRelease AI',
    category: 'ai',
    categoryLabel: 'AI & Multi-Agent',
    description: 'Automated release notes and documentation engine powered by Google Gemini 2.5 Pro.',
    problemSolved: 'Developers often dread drafting changelogs and synchronizing documentation across GitHub repositories, leading to outdated docs and slow ship cycles.',
    keyFeatures: [
      'Automatic GitHub webhook integration',
      'AST-aware commit and PR diff analysis',
      'Gemini 2.5 Pro markdown generator',
      'Exportable release templates & semantic tagging'
    ],
    technologies: ['TypeScript', 'Gemini 2.5 Pro', 'React', 'Tailwind CSS', 'GitHub API'],
    githubUrl: 'https://github.com/roco007/DocuReleaseAI',
    liveUrl: 'https://docureleaseai.vercel.app/',
    image: 'images/DocuReleaseAI_preview.webp',
    sysId: 'SYS.001',
    featured: true
  },
  {
    id: 'hh-judge-ai',
    title: 'HH Judge AI',
    category: 'ai',
    categoryLabel: 'AI & Multi-Agent',
    description: 'Multi-agent evaluation framework that judges hackathon & accelerator projects with panel-grade scrutiny.',
    problemSolved: 'Judging engineering projects manually is subjective and time-consuming. HH Judge AI reviews both live URLs and GitHub source trees objectively.',
    keyFeatures: [
      'Multi-agent panel debate simulation (Product, Tech, Design judges)',
      'Automated GitHub repo static analysis',
      'Live demo smoke test & latency verification',
      'Comprehensive scoring card & feedback report'
    ],
    technologies: ['TypeScript', 'Multi-Agent LLMs', 'Next.js', 'Tailwind CSS', 'Vercel'],
    githubUrl: 'https://github.com/roco007/HHJudgeAI',
    liveUrl: 'https://hh-judge-ai.vercel.app',
    image: 'images/HHJudgeAI_preview.webp',
    sysId: 'SYS.002',
    featured: true
  },
  {
    id: 'opportunity-ai',
    title: 'Opportunity AI',
    category: 'ai',
    categoryLabel: 'AI & Multi-Agent',
    description: 'Market intelligence engine discovering validated, high-conviction AI product opportunities for US & European founders.',
    problemSolved: 'Founders waste months on generic AI ideas without market validation. Opportunity AI delivers verified demand signals and MVP roadmaps.',
    keyFeatures: [
      'Regional market sentiment & competitor clustering',
      'MVP scope generation with technical feasibility score',
      'Validation strategies & pricing models',
      'Interactive dashboard with live trend feeds'
    ],
    technologies: ['TypeScript', 'React 19', 'Next.js', 'AI Market Analysis', 'Tailwind CSS'],
    githubUrl: 'https://github.com/roco007/OpporunityAi',
    liveUrl: 'https://opportunity-ai-blue.vercel.app',
    image: 'images/OpportunityAI_preview.webp',
    sysId: 'SYS.003',
    featured: true
  },
  {
    id: 'rate-shift-uk',
    title: 'Rate Shift UK',
    category: 'ai',
    categoryLabel: 'AI & Multi-Agent',
    description: 'AI mortgage monitoring platform for UK brokers tracking Bank of England interest rates & remortgage opportunities.',
    problemSolved: 'UK homeowners lose thousands due to delayed remortgaging. This platform monitors rate fluctuations and delivers instant broker triggers.',
    keyFeatures: [
      'Real-time Bank of England base rate feeds',
      'Break-even point & penalty amortisation calculator',
      'Personalised client recommendation generator',
      'Automated email notification dispatcher'
    ],
    technologies: ['TypeScript', 'Next.js', 'Financial Modeling', 'Automated Notifications'],
    githubUrl: 'https://github.com/roco007/RateShiftUK',
    liveUrl: 'https://rate-shift-uk.vercel.app/',
    image: 'images/RateShiftUK_preview.webp',
    sysId: 'SYS.004',
    featured: true
  },
  {
    id: 'resumemind-ai',
    title: 'ResumeMind AI',
    category: 'ai',
    categoryLabel: 'AI & Multi-Agent',
    description: 'Intelligent resume builder leveraging Gemini 3.5 Flash and GitHub profile analysis for job-targeted ATS resumes.',
    problemSolved: 'Resumes rarely align with job requirements. ResumeMind AI synchronizes real GitHub code achievements with target job descriptions.',
    keyFeatures: [
      'GitHub profile & repository extractor',
      'Gemini 3.5 Flash intelligent parser',
      'ATS score optimization & gap analysis',
      'One-click PDF/Docx output formatting'
    ],
    technologies: ['TypeScript', 'Google Gemini 3.5', 'Next.js', 'GitHub REST API', 'Tailwind CSS'],
    githubUrl: 'https://github.com/roco007/ResumeMind.AI',
    liveUrl: 'https://resumemindai-one.vercel.app',
    image: 'images/resumemind_preview.webp',
    sysId: 'SYS.005',
    featured: true
  },
  {
    id: 'css-to-tailwind',
    title: 'CSS to Tailwind',
    category: 'utility',
    categoryLabel: 'Dev Utilities',
    description: 'Bidirectional offline-first CSS to Tailwind CSS utility converter with real-time DOM sandbox rendering.',
    problemSolved: 'Migrating legacy CSS to modern Tailwind v4 utility classes is tedious and error-prone. This converter performs instant AST translation.',
    keyFeatures: [
      'Bidirectional conversion (CSS -> Tailwind & Tailwind -> CSS)',
      '100% private, client-side offline execution',
      'Tailwind CSS v4 class mapping & custom token matching',
      'Live sandboxed preview rendering'
    ],
    technologies: ['TypeScript', 'Tailwind CSS v4', 'AST Parsing', 'React 19', 'Vite'],
    githubUrl: 'https://github.com/roco007/css-to-tailwind',
    liveUrl: 'https://css-to-tailwind-theta.vercel.app',
    image: 'images/css_to_tailwind_preview.webp',
    sysId: 'SYS.006',
    featured: true
  },
  {
    id: 'sql-query-optimizer',
    title: 'SQL Query Optimizer',
    category: 'ai',
    categoryLabel: 'Dev Utilities',
    description: 'AI-assisted SQL analyzer detecting query anti-patterns, missing indexes, and execution bottlenecks.',
    problemSolved: 'Slow database queries degrade web apps. This tool diagnoses queries and provides actionable index & rewrite recommendations.',
    keyFeatures: [
      'Multi-dialect support (PostgreSQL, MySQL, SQL Server, SQLite)',
      'EXPLAIN plan visualization and bottleneck highlighting',
      'Index recommendation algorithm',
      'Zero-dependency local syntax checks'
    ],
    technologies: ['React 19', 'tRPC 11', 'Drizzle ORM', 'TypeScript', 'AI Query Engine'],
    githubUrl: 'https://github.com/roco007/sqlOptimizer',
    liveUrl: 'https://sqloptimize-t62cvurq.manus.space/',
    image: 'images/sql_optimizer_preview.webp',
    sysId: 'SYS.007',
    featured: true
  },
  {
    id: 'json-master',
    title: 'JSON Master',
    category: 'utility',
    categoryLabel: 'Dev Utilities',
    description: 'Complete in-browser JSON workbench with formatting, diff comparison, tree visualization, and schema conversion.',
    problemSolved: 'Developers constantly juggle JSON payloads that need quick validation, cleaning, or conversion to XML, CSV, or YAML.',
    keyFeatures: [
      'Bi-directional conversion (JSON, YAML, CSV, XML)',
      'Interactive collapsible tree visualizer',
      'Deep object difference highlighting',
      'Strict client-side processing for data privacy'
    ],
    technologies: ['TypeScript', 'React', 'Monaco Parser', 'Client-Side Workers'],
    githubUrl: 'https://github.com/roco007/jsonTools',
    liveUrl: 'https://jsonmaster-gfnesxad.manus.space',
    image: 'images/json_master_preview.webp',
    sysId: 'SYS.008',
    featured: false
  },
  {
    id: 'instant-qr',
    title: 'Instant QR Generator',
    category: 'utility',
    categoryLabel: 'Dev Utilities',
    description: 'Fast, privacy-first QR code generator running 100% locally with high-resolution vector and PNG export.',
    problemSolved: 'Online QR generators often hijack URLs with redirects, inject ads, or track user scans. Instant QR is 100% private and instant.',
    keyFeatures: [
      'Zero backend round-trips — runs completely offline',
      'Instant generation as you type with debounced canvas',
      '1000x1000px high-definition PNG and SVG export',
      'One-click clipboard copy'
    ],
    technologies: ['React 19', 'TypeScript', 'Tailwind CSS', 'node-qrcode'],
    githubUrl: 'https://github.com/roco007/instantQrGenerator',
    liveUrl: 'https://instantqr-f9mqj6lp.manus.space',
    image: 'images/instant_qr_preview.webp',
    sysId: 'SYS.009',
    featured: false
  },
  {
    id: 'yaml-editor-pro',
    title: 'YAML Editor Pro',
    category: 'utility',
    categoryLabel: 'Dev Utilities',
    description: 'Real-time YAML syntax validator, formatter, and bidirectional converter for cloud configs and CI/CD pipelines.',
    problemSolved: 'Indentation mistakes in Kubernetes, GitHub Actions, or Docker Compose YAML files cause costly build failures.',
    keyFeatures: [
      'Real-time syntax error markers with precise line pointers',
      'Bi-directional YAML <-> JSON lossless transformation',
      'Config workspace sharing with URL hash states',
      'Zero telemetry or external data leakage'
    ],
    technologies: ['Next.js', 'TypeScript', 'YAML Engine', 'Tailwind CSS'],
    githubUrl: 'https://github.com/roco007/yamlTools',
    liveUrl: 'https://yaml-tools-azure.vercel.app',
    image: 'images/yaml_editor_preview.webp',
    sysId: 'SYS.010',
    featured: false
  },
  {
    id: 'regex-dev',
    title: 'RegexDev',
    category: 'utility',
    categoryLabel: 'Dev Utilities',
    description: 'Interactive regex testing and debugging environment with visual AST breakdown and cross-engine matching.',
    problemSolved: 'Complex regular expressions are notoriously cryptic to debug and vary subtly across runtime engines.',
    keyFeatures: [
      'Multi-engine execution support (JS, Python, PCRE)',
      'Visual AST node tree breakdown',
      'Curated library of standard validation patterns',
      'Real-time match group extraction table'
    ],
    technologies: ['Next.js 16', 'TypeScript', 'AST Visualizer', 'Tailwind CSS'],
    githubUrl: 'https://github.com/roco007/regexCompare',
    liveUrl: 'https://regex-compare.vercel.app',
    image: 'images/regex_dev_preview.webp',
    sysId: 'SYS.011',
    featured: false
  },
  {
    id: 'faith-quest',
    title: 'FaithQuest Multi-Tier',
    category: 'interactive',
    categoryLabel: '3D & Interactive Apps',
    description: 'Location-based scripture scavenger hunt browser game with 3D landmarks and proximity radar navigation.',
    problemSolved: 'Creating an engaging, educational digital exploration game that bridges real physical geography with 3D gamification.',
    keyFeatures: [
      'Live map navigation with landmark discovery',
      'Proximity radar tracking for interactive NPC guardians',
      'Interactive riddle engine with inventory relics',
      'XP tracking, badges, and spatial audio feedback'
    ],
    technologies: ['TypeScript', 'Three.js', 'Geolocation API', 'React', 'Tailwind CSS'],
    githubUrl: 'https://github.com/roco007/FaithQuestMultiTier',
    liveUrl: 'https://faith-quest-multi-tier.vercel.app',
    image: 'images/faithquest_preview.webp',
    sysId: 'SYS.012',
    featured: true
  },
  {
    id: 'interactive-solar-system',
    title: 'Interactive Solar System',
    category: 'interactive',
    categoryLabel: '3D & Interactive Apps',
    description: 'High-fidelity 3D celestial simulation featuring realistic planetary motion, textures, and astronomical orbiters.',
    problemSolved: 'Simulating multi-body celestial physics smoothly in desktop and mobile web browsers without performance stutters.',
    keyFeatures: [
      'WebGL / Three.js 60fps orbital physics simulation',
      'High-resolution planetary surfaces and dynamic ring shadows',
      'Interactive zoom, pan, and orbital speed controls',
      'Detailed astronomical metrics overlay'
    ],
    technologies: ['TypeScript', 'Vite', 'Three.js / WebGL', 'Math Simulation'],
    githubUrl: 'https://github.com/roco007/Interactive-Solar-System',
    liveUrl: 'https://interactive-solar-system-weld.vercel.app',
    image: 'images/interactive-solar-system_preview.webp',
    sysId: 'SYS.013',
    featured: true
  },
  {
    id: 'workout-tracker',
    title: 'Workout Tracker',
    category: 'interactive',
    categoryLabel: '3D & Interactive Apps',
    description: 'Comprehensive fitness dashboard for managing progressive overload, multi-day splits, and volume metrics.',
    problemSolved: 'Bulky fitness apps filled with paywalls and ads disrupt gym workouts. This tracker is clean, direct, and focused.',
    keyFeatures: [
      'Multi-day training split routine builder',
      'Granular logging of sets, reps, and weights',
      'Muscle group frequency and recovery tracking',
      'Local storage persistence with zero cloud lock-in'
    ],
    technologies: ['JavaScript', 'CSS3', 'HTML5', 'LocalStorage API'],
    githubUrl: 'https://github.com/roco007/Wrokout-Tracker',
    liveUrl: 'https://roco007.github.io/Wrokout-Tracker/',
    image: 'images/workout_tracker.webp',
    sysId: 'SYS.014',
    featured: false
  }
];

export const EXPERIENCE: ExperienceItem[] = [
  {
    id: 'exp-1',
    role: 'Software Engineer',
    organization: 'Deloitte USI',
    period: 'May 2026 - Present',
    location: 'Remote',
    globeLocation: {
      latitude: 0,
      longitude: 0,
      label: 'REMOTE',
      isRemote: true,
    },
    summary: 'Contributing to AI-driven development of internal tools using GitHub Copilot, Angular, and C#.',
    achievements: [
      'Use GitHub Copilot to support AI-assisted software development workflows.',
      'Contribute to internal tool development using Angular and C#.',
      'Assist with building and evolving AI-driven internal tools for Deloitte USI teams.'
    ],
    technologies: ['GitHub Copilot', 'Angular', 'C#']
  },
  {
    id: 'exp-2',
    role: 'Software Engineer',
    organization: 'FlexiLoans',
    period: 'June 2022 - May 2026',
    location: 'Mumbai, India',
    globeLocation: {
      latitude: 19.076,
      longitude: 72.8777,
      label: 'MUMBAI, INDIA',
    },
    summary: 'Built backend automation and configuration systems for lending operations, including bank-statement analysis, data validation, and AWS-backed services.',
    achievements: [
      'Integrated third-party PDF processors to ingest analyzed bank-statement PDFs for lending workflows.',
      'Built backend pipelines to parse, normalize, and validate transactions, balances, and income indicators.',
      'Implemented rule-based mechanisms to dynamically evaluate system health and resource allocation.',
      'Built data aggregation, tagging, and workflow automation frameworks to identify system issues and reduce manual incident-management work.',
      'Designed role-based configuration frameworks and digital forms for complex business rules and granular access control.',
      'Managed backend-service lifecycles with AWS S3 and CloudWatch.',
      'Improved policy and version management with contextual tooltips and dropdown quick actions.'
    ],
    technologies: ['AWS S3', 'Amazon CloudWatch', 'Third-party PDF processing']
  }
];

export const NAV_LINKS = [
  { id: 'hero', label: 'Home', number: '01' },
  { id: 'about', label: 'About', number: '02' },
  { id: 'skills', label: 'Skills', number: '03' },
  { id: 'projects', label: 'Projects', number: '04' },
  { id: 'experience', label: 'Experience', number: '05' },
  { id: 'contact', label: 'Contact', number: '06' }
];
