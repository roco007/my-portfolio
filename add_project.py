#!/usr/bin/env python3
"""
Automated Project Ingestion Script for Raj Colaco's Portfolio.
Takes 1 input: GitHub Repository URL.
- Automatically derives Project Name from repo name by splitting camelCase / PascalCase.
- Fetches Description from GitHub repository 'About' section.
- Fetches Project Link (Live Demo URL) from GitHub repository 'About' website section.
- Auto-infers Category and Tags from topics and description.
- Automatically inserts the new card at the TOP of the projects grid (before existing cards).
- Renumbers SYS.001, SYS.002... and updates the DEPLOYED UNITS HUD counter.
"""

import sys
import os
import re
import json
import shutil
import argparse
import urllib.request
import urllib.error

INDEX_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "images")

# Terminal colors for interactive UX
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
PINK = "\033[95m"
BOLD = "\033[1m"
RESET = "\033[0m"

CATEGORY_MAP = {
    "ai": ("ai", "AI & Multi-Agent", "tag-ai"),
    "utility": ("utility", "Dev Utilities", "tag-utility"),
    "interactive": ("interactive", "3D & Apps", "tag-interactive"),
}

KNOWN_ACRONYMS = {
    "ai": "AI", "llm": "LLM", "api": "API", "ui": "UI", "qr": "QR",
    "json": "JSON", "sql": "SQL", "yaml": "YAML", "css": "CSS",
    "html": "HTML", "js": "JS", "hh": "HH", "pro": "Pro", "sdk": "SDK",
    "cli": "CLI", "tts": "TTS", "nlp": "NLP", "ml": "ML"
}


def parse_repo_identifier(repo_input):
    """
    Extract (owner, repo_name) from various input formats:
    - https://github.com/roco007/OpporunityAi
    - github.com/roco007/OpporunityAi
    - roco007/OpporunityAi
    """
    clean = repo_input.strip().strip("'\"")
    # Remove trailing .git or slashes
    clean = re.sub(r'\.git/?$', '', clean)
    clean = clean.rstrip('/')

    match = re.search(r'(?:github\.com/)?([^/\s]+)/([^/\s]+)$', clean)
    if match:
        return match.group(1), match.group(2)
    return None, None


def split_camel_case_name(raw_name):
    """
    Convert camelCase, PascalCase, kebab-case, or snake_case to Title Case:
    - 'justDoIt' -> 'Just Do It'
    - 'JustDoIt' -> 'Just Do It'
    - 'OpporunityAi' -> 'Opporunity AI'
    - 'HHJudgeAI' -> 'HH Judge AI'
    - 'interactive-solar-system' -> 'Interactive Solar System'
    """
    # Replace separators with spaces
    name = raw_name.replace('-', ' ').replace('_', ' ')

    # Insert space before capital letters (handling acronym sequences like HHJudge -> HH Judge)
    s1 = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', name)
    s2 = re.sub(r'([a-z\d])([A-Z])', r'\1 \2', s1)

    words = s2.split()
    capitalized = []
    for w in words:
        low = w.lower()
        if low in KNOWN_ACRONYMS:
            capitalized.append(KNOWN_ACRONYMS[low])
        else:
            capitalized.append(w.capitalize())

    return " ".join(capitalized)


def fetch_github_repo_data(owner, repo):
    """
    Fetch repository metadata using GitHub REST API with fallback to HTML scraping.
    Returns: dict with name, description, homepage, topics, language
    """
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)",
        "Accept": "application/vnd.github.v3+json"
    }

    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return {
                "name": data.get("name") or repo,
                "description": (data.get("description") or "").strip(),
                "homepage": (data.get("homepage") or "").strip(),
                "topics": data.get("topics") or [],
                "language": data.get("language") or "",
                "html_url": data.get("html_url") or f"https://github.com/{owner}/{repo}"
            }
    except Exception as e:
        print(f"{YELLOW}Notice: GitHub API returned ({e}). Attempting direct repository page fetch...{RESET}")

    # Fallback to scraping repository public HTML
    html_url = f"https://github.com/{owner}/{repo}"
    try:
        req = urllib.request.Request(html_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            
            # Extract description
            desc_match = re.search(r'<p class="f4 my-3"[^>]*>(.*?)</p>', html, re.DOTALL)
            if not desc_match:
                desc_match = re.search(r'<meta\s+property="og:description"\s+content="([^"]+)"', html)
            description = ""
            if desc_match:
                description = re.sub(r'<[^>]+>', '', desc_match.group(1)).strip()

            # Extract homepage link
            home_match = re.search(r'<span class="flex-auto min-width-0 css-truncate css-truncate-target text-bold"><a[^>]+href="([^"]+)"', html)
            if not home_match:
                home_match = re.search(r'role="link"[^>]+href="(https?://[^"]+)"', html)
            homepage = home_match.group(1).strip() if home_match else ""

            return {
                "name": repo,
                "description": description,
                "homepage": homepage,
                "topics": [],
                "language": "",
                "html_url": html_url
            }
    except Exception as fallback_err:
        print(f"{YELLOW}Fallback fetch notice: {fallback_err}{RESET}")

    return {
        "name": repo,
        "description": "",
        "homepage": "",
        "topics": [],
        "language": "",
        "html_url": f"https://github.com/{owner}/{repo}"
    }


def infer_category(name, description, topics, language):
    """Auto-detect project category (ai, utility, interactive) based on keywords."""
    blob = f"{name} {description} {' '.join(topics)} {language}".lower()

    if any(k in blob for k in ["ai", "llm", "agent", "gpt", "neural", "deep learning", "machine learning", "rag", "huggingface", "langchain"]):
        return "ai"
    if any(k in blob for k in ["3d", "game", "solar", "three.js", "threejs", "canvas", "interactive", "simulation", "physics", "webgl", "animation"]):
        return "interactive"
    if any(k in blob for k in ["tool", "utility", "converter", "generator", "editor", "regex", "json", "yaml", "sql", "formatter", "validator", "devtools"]):
        return "utility"

    return "ai"


def infer_tags(category, topics, language):
    """Generate 2 clean tags for the card header."""
    tags = []

    # Priority 1: GitHub topics
    for t in topics:
        clean_t = t.replace('-', ' ').title()
        if clean_t.lower() in KNOWN_ACRONYMS:
            clean_t = KNOWN_ACRONYMS[clean_t.lower()]
        if clean_t not in tags and len(clean_t) < 16:
            tags.append(clean_t)
        if len(tags) >= 2:
            break

    # Priority 2: Primary language
    if len(tags) < 2 and language and language not in tags:
        tags.append(language)

    # Defaults by category if needed
    if len(tags) < 2:
        defaults = {
            "ai": ["AI Tool", "Full Stack"],
            "utility": ["Utility", "Web App"],
            "interactive": ["Interactive", "Web App"]
        }
        for d in defaults.get(category, ["Project", "Web App"]):
            if d not in tags:
                tags.append(d)
            if len(tags) >= 2:
                break

    return tags[:2]


def find_matching_image(repo_name):
    """Check if an image corresponding to the repository name exists in assets/images, using exact & fuzzy matching."""
    if not os.path.exists(IMAGES_DIR):
        return "assets/images/project-placeholder.svg"

    clean_target = re.sub(r'[^a-zA-Z0-9]', '', repo_name).lower()
    available_files = [f for f in os.listdir(IMAGES_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp', '.svg'))]

    # 1. Exact substring check
    for filename in available_files:
        clean_file = re.sub(r'[^a-zA-Z0-9]', '', filename).lower()
        if clean_target in clean_file or clean_file in clean_target:
            return f"assets/images/{filename}"

    # 2. Fuzzy similarity check (e.g. OpporunityAi -> OpportunityAI_preview.png)
    import difflib
    cleaned_map = {}
    for filename in available_files:
        simplified = re.sub(r'(_preview|\.png|\.jpg|\.jpeg|\.webp|\.svg|[-_])', '', filename.lower())
        cleaned_map[simplified] = filename

    matches = difflib.get_close_matches(clean_target, list(cleaned_map.keys()), n=1, cutoff=0.65)
    if matches:
        return f"assets/images/{cleaned_map[matches[0]]}"

    # Default fallback
    return "assets/images/project-placeholder.svg"


def build_card_html(name, live_url, repo_url, description, category_key, category_class, tags_list, image_src):
    """Generate HTML string for the new project card."""
    tags_html = []
    for i, tag in enumerate(tags_list):
        tag_str = tag.strip()
        if not tag_str:
            continue
        if i == 0 and category_class:
            tags_html.append(f'                                <span class="tag {category_class}">{tag_str}</span>')
        else:
            tags_html.append(f'                                <span class="tag">{tag_str}</span>')

    rendered_tags = "\n".join(tags_html) if tags_html else f'                                <span class="tag {category_class}">Project</span>'

    card_template = f"""                <!-- Project: {name} -->
                <article class="project-card glass-cyber fade-in" data-category="{category_key}">
                    <span class="card-corner tl"></span>
                    <span class="card-corner tr"></span>
                    <span class="card-corner bl"></span>
                    <span class="card-corner br"></span>
                    <div class="card-laser-glow"></div>

                    <!-- Live Site Overlay Link -->
                    <a href="{live_url}" target="_blank" rel="noopener noreferrer"
                        class="card-live-overlay" aria-label="Launch {name} live demo"></a>

                    <div class="card-image-wrapper">
                        <img src="{image_src}" alt="{name} Preview" class="card-image" loading="lazy" decoding="async" width="768" height="432">
                        <div class="cyber-laser-scan"></div>
                        <a href="{live_url}" target="_blank" rel="noopener noreferrer" class="card-overlay" aria-label="Initialize {name} Demo">
                            <span class="live-btn">
                                <span class="btn-text">INITIALIZE DEMO</span>
                                <span class="arrow">↗</span>
                            </span>
                        </a>
                    </div>
                    <div class="card-content">
                        <div class="card-header-meta">
                            <div class="tags">
{rendered_tags}
                            </div>
                            <span class="cyber-chip-id">SYS.001</span>
                        </div>
                        <h3>
                            <a href="{repo_url}" target="_blank" rel="noopener noreferrer"
                                class="project-title-link">{name}</a>
                        </h3>
                        <p>{description}</p>
                    </div>
                </article>"""
    return card_template


def insert_card_into_html(card_html):
    """Insert the new project card at the TOP of the projects grid and renumber systems."""
    if not os.path.exists(INDEX_PATH):
        print(f"{PINK}Error: Could not find index.html at '{INDEX_PATH}'{RESET}")
        sys.exit(1)

    with open(INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Locate <div class="projects-grid" id="projects-grid">
    grid_pattern = re.compile(r'(<div\s+class="projects-grid"[^>]*id="projects-grid"[^>]*>)', re.IGNORECASE)
    match = grid_pattern.search(content)

    if not match:
        print(f"{PINK}Error: Could not find <div class=\"projects-grid\" id=\"projects-grid\"> in index.html.{RESET}")
        sys.exit(1)

    insert_pos = match.end()

    # Insert card at the very top of the grid (before existing cards)
    updated_content = content[:insert_pos] + "\n" + card_html + "\n" + content[insert_pos:]

    # Renumber SYS.001, SYS.002, SYS.003... across all cards
    chip_counter = 1
    def replace_chip(m):
        nonlocal chip_counter
        num_str = f"SYS.{chip_counter:03d}"
        chip_counter += 1
        return f'<span class="cyber-chip-id">{num_str}</span>'

    updated_content = re.sub(r'<span class="cyber-chip-id">SYS\.\d+</span>', replace_chip, updated_content)
    total_projects = chip_counter - 1

    # Update DEPLOYED UNITS counter in the telemetry HUD (e.g. "11 AI APPS")
    hud_pattern = re.compile(r'(<span class="telemetry-label">DEPLOYED UNITS</span>\s*<span class="telemetry-value">)\d+\s+AI\s+APPS(</span>)', re.IGNORECASE)
    if hud_pattern.search(updated_content):
        updated_content = hud_pattern.sub(rf'\g<1>{total_projects} AI APPS\g<2>', updated_content)

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        f.write(updated_content)

    return total_projects


def process_repo(repo_input, override_name=None, override_live=None, override_desc=None, override_category=None, override_image=None, override_tags=None):
    """Main workflow: fetch data from GitHub repo, derive fields, and add to index.html."""
    owner, repo_name = parse_repo_identifier(repo_input)

    if not owner or not repo_name:
        print(f"{PINK}Error: Invalid repository format '{repo_input}'.{RESET}")
        print(f"Please provide: {YELLOW}https://github.com/owner/repo{RESET} or {YELLOW}owner/repo{RESET}")
        sys.exit(1)

    print(f"\n{CYAN}⚡ Fetching metadata from GitHub repository:{RESET} {BOLD}{owner}/{repo_name}{RESET}...")
    repo_data = fetch_github_repo_data(owner, repo_name)

    # 1. Derive Project Name (split camelCase / PascalCase)
    derived_name = split_camel_case_name(repo_data["name"])
    final_name = override_name or derived_name

    # 2. Derive Description (from GitHub repo About section)
    about_description = repo_data["description"]
    if not about_description:
        about_description = f"Production-grade {final_name} application."
    final_desc = override_desc or about_description

    # 3. Derive Project Live Demo Link (from GitHub repo About section)
    about_homepage = repo_data["homepage"]
    if about_homepage and not about_homepage.startswith("http://") and not about_homepage.startswith("https://"):
        about_homepage = f"https://{about_homepage}"
    if not about_homepage:
        about_homepage = repo_data["html_url"]
    final_live = override_live or about_homepage

    # 4. Repo URL
    final_repo = repo_data["html_url"]

    # 5. Infer Category & Tags
    inferred_cat = infer_category(repo_data["name"], repo_data["description"], repo_data["topics"], repo_data["language"])
    cat_key = override_category or inferred_cat
    _, cat_name, cat_class = CATEGORY_MAP.get(cat_key, ("ai", "AI & Multi-Agent", "tag-ai"))

    if override_tags:
        tags_list = [t.strip() for t in override_tags.split(",") if t.strip()]
    else:
        tags_list = infer_tags(cat_key, repo_data["topics"], repo_data["language"])

    # 6. Preview Image
    if override_image:
        final_image = override_image
    else:
        final_image = find_matching_image(repo_name)

    # 7. Generate card HTML and insert into index.html
    card_html = build_card_html(
        name=final_name,
        live_url=final_live,
        repo_url=final_repo,
        description=final_desc,
        category_key=cat_key,
        category_class=cat_class,
        tags_list=tags_list,
        image_src=final_image
    )

    total_projects = insert_card_into_html(card_html)

    # Print summary
    print(f"\n{GREEN}{BOLD}══════════════════════════════════════════════════════════════{RESET}")
    print(f"{GREEN}{BOLD}✓ SUCCESS: Added '{final_name}' before existing cards!{RESET}")
    print(f"{GREEN}{BOLD}══════════════════════════════════════════════════════════════{RESET}")
    print(f"  {CYAN}Position:{RESET}       1st Card in Projects Grid (SYS.001)")
    print(f"  {CYAN}Project Name:{RESET}   {final_name}  {YELLOW}(derived from '{repo_name}'){RESET}")
    print(f"  {CYAN}Live Demo URL:{RESET}  {final_live}  {YELLOW}(from GitHub About link){RESET}")
    print(f"  {CYAN}Repository:{RESET}     {final_repo}")
    print(f"  {CYAN}Description:{RESET}    {final_desc}  {YELLOW}(from GitHub About desc){RESET}")
    print(f"  {CYAN}Category:{RESET}       {cat_name} (`{cat_key}`)")
    print(f"  {CYAN}Tags:{RESET}           {', '.join(tags_list)}")
    print(f"  {CYAN}Image:{RESET}          {final_image}")
    print(f"  {CYAN}Total Units:{RESET}    {total_projects} AI APPS (HUD updated)")
    print(f"{GREEN}{BOLD}══════════════════════════════════════════════════════════════{RESET}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Add a project to Raj Colaco's portfolio using just the GitHub repo URL."
    )
    # Single required/optional positional argument for repo link
    parser.add_argument("repo_url", nargs="?", help="GitHub repository URL or owner/repo (e.g. https://github.com/roco007/OpporunityAi)")
    
    # Optional manual overrides
    parser.add_argument("-n", "--name", help="Override project name")
    parser.add_argument("-l", "--live", help="Override live demo URL")
    parser.add_argument("-d", "--desc", help="Override description")
    parser.add_argument("-c", "--category", choices=["ai", "utility", "interactive"], help="Override category")
    parser.add_argument("-i", "--image", help="Override preview image path")
    parser.add_argument("-t", "--tags", help="Override tags (comma-separated)")

    args = parser.parse_args()

    repo_input = args.repo_url
    if not repo_input:
        print(f"\n{CYAN}{BOLD}╔═══════════════════════════════════════════════════════════╗{RESET}")
        print(f"{CYAN}{BOLD}║         CYBER PORTFOLIO // 1-INPUT PROJECT INGESTOR       ║{RESET}")
        print(f"{CYAN}{BOLD}╚═══════════════════════════════════════════════════════════╝{RESET}\n")
        try:
            repo_input = input(f"{CYAN}? Enter GitHub Repository Link{RESET} (e.g. https://github.com/roco007/justDoIt): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            sys.exit(0)

    if not repo_input:
        print(f"{PINK}Error: Repository link is required.{RESET}")
        sys.exit(1)

    process_repo(
        repo_input=repo_input,
        override_name=args.name,
        override_live=args.live,
        override_desc=args.desc,
        override_category=args.category,
        override_image=args.image,
        override_tags=args.tags
    )


if __name__ == "__main__":
    main()
