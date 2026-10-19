import {
  EXPERIENCE,
  PERSONAL_INFO,
  PROJECTS,
  SKILL_CATEGORIES,
  SOCIAL_LINKS,
} from './portfolio';

/**
 * Portfolio chatbot brain — a small rule-based intent matcher that answers
 * visitor questions about this site. Everything user-facing is derived from
 * `portfolio.ts`, so the bot never drifts from the real content.
 *
 * Matching: keywords are scored by word count (+ bonus for phrases); the
 * highest-scoring entry above MIN_SCORE wins. Below threshold we admit we
 * didn't understand — no pretending.
 */

export interface KnowledgeEntry {
  id: string;
  /** Lowercase phrases. Matched word-by-word when ≤3 chars, substring otherwise. */
  keywords: string[];
  reply: string | ((normalizedQuery: string) => string);
}

export interface ChatAnswer {
  reply: string;
  /** false → the bot did not understand the question. */
  matched: boolean;
}

/** Any entry scoring below this is treated as "not understood". */
const MIN_SCORE = 2;

/** Chips shown above the input — the bot's predefined questions. */
export const PREDEFINED_QUESTIONS: string[] = [
  'Who is Raj?',
  "What's his tech stack?",
  'Show me his projects',
  'Where has he worked?',
  'How can I contact him?',
  'Which AI created you?',
];

export const GREETING_REPLY =
  "SYS.ONLINE // Hi — I'm Raj's AI portfolio agent.\n" +
  'Ask me about Raj — his stack, projects, experience, resume — or how to get in touch.\n' +
  'Pick a chip below or type your own question.';

const FALLBACK_REPLY =
  'ERR::404 — that query short-circuited my circuits. My knowledge is limited to this portfolio, so I did not understand it.\n' +
  "Try one of the predefined questions below — or ask about Raj's skills, projects, experience, or contact details.";

/* --------------------------------------------------------------------------
   Normalization + scoring
   -------------------------------------------------------------------------- */

const normalize = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9\s'&.+-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Short keywords (hi, ai, cv, city…) need word boundaries to avoid substring hits. */
const keywordMatches = (norm: string, keyword: string): boolean => {
  if (keyword.length <= 4) {
    return new RegExp(`(?:^|\\s)${escapeRegExp(keyword)}(?:\\s|$)`).test(norm);
  }
  return norm.includes(keyword);
};

const scoreEntry = (norm: string, entry: KnowledgeEntry): number =>
  entry.keywords.reduce((points, keyword) => {
    if (!keywordMatches(norm, keyword)) return points;
    const words = keyword.split(' ').length;
    return points + words * 2 + (keyword.includes(' ') ? 1 : 0);
  }, 0);

/* --------------------------------------------------------------------------
   Static knowledge (data pulled from portfolio.ts where it matters)
   -------------------------------------------------------------------------- */

const GREETING: KnowledgeEntry = {
  id: 'greeting',
  keywords: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'yo', 'namaste'],
  reply: GREETING_REPLY,
};

const HELP: KnowledgeEntry = {
  id: 'help',
  keywords: ['help', 'what can you', 'what can i ask', 'options', 'menu', 'commands', 'topics', 'questions', 'ask you'],
  reply:
    "I'm wired for portfolio queries:\n" +
    '• Who is Raj — bio, role, stats\n' +
    "• His tech stack & AI expertise\n" +
    '• Projects — ask about any by name (e.g. DocuRelease AI)\n' +
    '• Work experience\n' +
    '• Contact, resume & location\n' +
    '• The "which AI created me" riddle\n\n' +
    'Click any chip below to fire one off.',
};

const THANKS: KnowledgeEntry = {
  id: 'thanks',
  keywords: ['thanks', 'thank you', 'thx', 'appreciate', 'nice one', 'cool'],
  reply: 'Anytime. Curious about anything else on this portfolio?',
};

const BYE: KnowledgeEntry = {
  id: 'bye',
  keywords: ['bye', 'goodbye', 'see you', 'see ya', 'later'],
  reply: 'Signing off. I live bottom-right — reopen me anytime.',
};

const RIDDLE: KnowledgeEntry = {
  id: 'riddle',
  keywords: [
    'created you', 'made you', 'built you', 'build you', 'created me', 'made me',
    'who made', 'which ai', 'ai created', 'your creator', 'draw you', 'artistic intelligence',
  ],
  reply:
    "That's the Easter egg — I'm not confirming anything.\n" +
    'Hover me to flip and study my other face for clues.\n' +
    'Raj logs every guess — drop yours in the Contact section.',
};

const AI_EXPERTISE: KnowledgeEntry = {
  id: 'ai',
  keywords: ['ai', 'artificial intelligence', 'llm', 'llms', 'agents', 'agent', 'gemini', 'machine learning', 'rag', 'prompt', 'models'],
  reply: () => {
    const aiCat = SKILL_CATEGORIES.find((c) => c.id === 'ai-agents');
    const skills = aiCat ? aiCat.skills.map((s) => `• ${s.name}`).join('\n') : '';
    return (
      "AI is Raj's core lane — " +
      (aiCat ? aiCat.description : '') +
      '\n\n' +
      skills +
      '\n\nFlagships: HH Judge AI (multi-agent judging panel) & DocuRelease AI (Gemini release engine).'
    );
  },
};

const EXPERIENCE_ENTRY: KnowledgeEntry = {
  id: 'experience',
  keywords: [
    'experience', 'career', 'companies', 'company', 'worked', 'worked at',
    'employment', 'deloitte', 'flexiloans', 'jobs', 'work history', 'previous roles',
  ],
  reply: () => {
    const lines = EXPERIENCE.map(
      (e) => `• ${e.role} @ ${e.organization} (${e.period}${e.location ? `, ${e.location}` : ''}) — ${e.summary}`,
    ).join('\n');
    return `Raj has ${PERSONAL_INFO.stats.yearsOfExperience} in production engineering:\n\n${lines}`;
  },
};

const ABOUT: KnowledgeEntry = {
  id: 'about',
  keywords: [
    'who is raj', 'who are you', 'about raj', 'about you', 'yourself', 'bio',
    'your name', 'introduce', 'raj colaco', 'whos raj', 'about', 'job', 'role',
    'profession', 'what does raj do', 'what do you do', 'stats',
  ],
  reply:
    `${PERSONAL_INFO.name} — ${PERSONAL_INFO.role}.\n` +
    `"${PERSONAL_INFO.tagline}"\n\n` +
    `• ${PERSONAL_INFO.stats.deployedProjects}+ deployed production units & ${PERSONAL_INFO.stats.openSourceRepos} public repos\n` +
    '• Bridges frontier AI (Gemini, agentic workflows, AST analysis) with offline-first React / TypeScript / Node.js\n' +
    `• Based in ${PERSONAL_INFO.location.split(',')[0]} — ${PERSONAL_INFO.availableForHire ? 'open to new deployments' : 'not looking right now'}`,
};

const SKILLS_ENTRY: KnowledgeEntry = {
  id: 'skills',
  keywords: ['skills', 'skill', 'stack', 'tech stack', 'technologies', 'technology', 'tools', 'languages', 'know', 'proficient', 'expertise', 'what can he use'],
  reply: () => {
    const lines = SKILL_CATEGORIES.map((c) => {
      const highlights = c.skills.filter((s) => s.highlight).map((s) => s.name);
      const picks = (highlights.length ? highlights : c.skills.slice(0, 2).map((s) => s.name)).slice(0, 3);
      return `• ${c.title} — ${picks.join(', ')}`;
    }).join('\n');
    return `Raj's stack, by layer:\n\n${lines}\n\nAsk "what's his AI expertise?" for the deep end.`;
  },
};

const PROJECTS_ENTRY: KnowledgeEntry = {
  id: 'projects',
  keywords: ['projects', 'project', 'built', 'building', 'apps', 'applications', 'portfolio', 'show me', 'side projects', 'things he made'],
  reply: () => {
    const featured = PROJECTS.filter((p) => p.featured).slice(0, 5);
    const lines = featured
      .map((p) => `• ${p.title} — ${p.description.replace(/\.$/, '')}`)
      .join('\n');
    return (
      `${PERSONAL_INFO.stats.deployedProjects} shipped projects live in the Projects section. Highlights:\n\n` +
      `${lines}\n\n` +
      'Ask me about any of them by name — e.g. "Tell me about Opportunity AI".'
    );
  },
};

const CONTACT_ENTRY: KnowledgeEntry = {
  id: 'contact',
  keywords: ['contact', 'email', 'hire', 'hiring', 'reach', 'get in touch', 'available', 'freelance', 'talk to', 'social', 'whatsapp', 'telegram', 'phone'],
  reply: () => {
    const lines = SOCIAL_LINKS.filter((l) => ['github', 'linkedin', 'x', 'email'].includes(l.platform))
      .map((l) => `• ${l.name} — ${l.platform === 'email' ? l.handle : l.url}`)
      .join('\n');
    return (
      `${PERSONAL_INFO.availableForHire ? 'Raj is available for hire' : 'Raj is not looking right now'} (${PERSONAL_INFO.status}):\n\n` +
      lines +
      '\n\nAlso on Telegram, WhatsApp & Instagram — the Contact section has every link, and it lands straight in his inbox.'
    );
  },
};

const RESUME_ENTRY: KnowledgeEntry = {
  id: 'resume',
  keywords: ['resume', 'cv', 'download', 'pdf'],
  reply:
    'Grab the PDF: /Raj_Colaco_Resume.pdf (opens in a new tab)\n' +
    'Or hit the RESUME button in the navbar.',
};

const LOCATION_ENTRY: KnowledgeEntry = {
  id: 'location',
  keywords: ['where is', 'where does', 'location', 'based', 'live in', 'lives', 'india', 'mumbai', 'vasai', 'city', 'country', 'timezone'],
  reply: `${PERSONAL_INFO.location} (IST, UTC+5:30) — currently working remote.`,
};

const GITHUB_ENTRY: KnowledgeEntry = {
  id: 'github',
  keywords: ['github', 'repos', 'repositories', 'open source', 'source code', 'roco007'],
  reply:
    'github.com/roco007 — 34 public repositories.\n' +
    'Notable: DocuRelease AI, HH Judge AI, CSS to Tailwind, JSON Master… ask me about any project by name.',
};

const SITE_ENTRY: KnowledgeEntry = {
  id: 'site',
  keywords: ['this site', 'this website', 'made this', 'built this', 'portfolio site', 'who made this', 'source of this site', 'this page', 'animations'],
  reply:
    'Hand-built by Raj — no site builders, no templates.\n' +
    'React 19 + TypeScript + Vite, a hand-rolled canvas space background, CSS design tokens, and a cinematic intro sequence.\n' +
    'Everything is committed: github.com/roco007/my-portfolio',
};

const AI_GUESS_MODELS = ['gemini', 'chatgpt', 'claude', 'midjourney', 'grok', 'copilot', 'dall-e', 'stable diffusion', 'flux'];

const GUESS_ENTRY: KnowledgeEntry = {
  id: 'guess',
  keywords: ['is it', 'is that', 'you might be', 'you are a', 'guess', ...AI_GUESS_MODELS],
  reply: (norm) => {
    const hit = AI_GUESS_MODELS.find((m) => norm.includes(m)) ?? '???';
    return (
      `Logged: "${hit.toUpperCase()}" — filed in the Hall of Guesses.\n` +
      "Raj isn't confirming anything. Hover me — my other face knows the truth."
    );
  },
};

/* --------------------------------------------------------------------------
   Per-project knowledge — generated straight from PROJECTS
   -------------------------------------------------------------------------- */

const PROJECT_ENTRIES: KnowledgeEntry[] = PROJECTS.map((p) => ({
  id: p.id,
  keywords: [
    p.title.toLowerCase(),
    ...p.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3),
  ],
  reply:
    `${p.title} (${p.categoryLabel})\n${p.description}\n\n` +
    `Key features:\n${p.keyFeatures.slice(0, 3).map((f) => `• ${f}`).join('\n')}\n\n` +
    `Stack: ${p.technologies.join(' · ')}\n` +
    (p.liveUrl ? `Live: ${p.liveUrl}\n` : '') +
    `Code: ${p.githubUrl}`,
}));

/* --------------------------------------------------------------------------
   Entry table — ORDER MATTERS: on score ties the earlier entry wins, so
   ambiguous words route to the most likely intent.
   -------------------------------------------------------------------------- */

const ENTRIES: KnowledgeEntry[] = [
  GREETING, HELP, THANKS, BYE, RIDDLE, AI_EXPERTISE, EXPERIENCE_ENTRY, ABOUT,
  SKILLS_ENTRY, PROJECTS_ENTRY, CONTACT_ENTRY, RESUME_ENTRY, LOCATION_ENTRY,
  GITHUB_ENTRY, SITE_ENTRY, GUESS_ENTRY,
  ...PROJECT_ENTRIES,
];

/**
 * Resolve a visitor question to the best-matching knowledge entry.
 * Returns matched: false (plus a friendly ERR reply) below the score threshold.
 */
export const matchAnswer = (query: string): ChatAnswer => {
  const norm = normalize(query);
  if (!norm) return { reply: FALLBACK_REPLY, matched: false };

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of ENTRIES) {
    const score = scoreEntry(norm, entry);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best || bestScore < MIN_SCORE) {
    return { reply: FALLBACK_REPLY, matched: false };
  }
  return {
    reply: typeof best.reply === 'function' ? best.reply(norm) : best.reply,
    matched: true,
  };
};


