#!/usr/bin/env python3
"""
Automated Project Ingestion Script for Raj Colaco's Portfolio.

Fetches GitHub metadata, collects the portfolio-specific fields, and appends a
schema-complete Project object to src/data/portfolio.ts on the current branch.
"""

import sys
import os
import re
import json
import argparse
import tempfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Sequence
from urllib.parse import urlparse

PROJECT_ROOT = Path(__file__).resolve().parent
PORTFOLIO_PATH = PROJECT_ROOT / "src" / "data" / "portfolio.ts"
IMAGES_DIR = PROJECT_ROOT / "public" / "images"

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
    "interactive": ("interactive", "3D & Interactive Apps", "tag-interactive"),
}


class PortfolioUpdateError(RuntimeError):
    """Raised when a project cannot be safely added to portfolio.ts."""


@dataclass(frozen=True)
class ProjectEntry:
    """A schema-complete project record for src/data/portfolio.ts."""

    id: str
    title: str
    category: str
    category_label: str
    description: str
    problem_solved: str
    key_features: Sequence[str]
    technologies: Sequence[str]
    github_url: str
    live_url: Optional[str]
    image: str
    featured: bool = True


def _typescript_string(value):
    """Serialize a Python string as a safe TypeScript string literal."""
    return json.dumps(value, ensure_ascii=False)


def _render_string_array(field_name, values):
    lines = [f"    {field_name}: ["]
    for value in values:
        lines.append(f"      {_typescript_string(value)},")
    lines.append("    ],")
    return lines


def _render_project_entry(project, sys_id):
    lines = [
        "  {",
        f"    id: {_typescript_string(project.id)},",
        f"    title: {_typescript_string(project.title)},",
        f"    category: {_typescript_string(project.category)},",
        f"    categoryLabel: {_typescript_string(project.category_label)},",
        f"    description: {_typescript_string(project.description)},",
        f"    problemSolved: {_typescript_string(project.problem_solved)},",
    ]
    lines.extend(_render_string_array("keyFeatures", project.key_features))
    lines.extend(_render_string_array("technologies", project.technologies))
    lines.append(f"    githubUrl: {_typescript_string(project.github_url)},")
    if project.live_url:
        lines.append(f"    liveUrl: {_typescript_string(project.live_url)},")
    lines.extend(
        [
            f"    image: {_typescript_string(project.image)},",
            f"    sysId: {_typescript_string(sys_id)},",
            f"    featured: {'true' if project.featured else 'false'}",
            "  }",
        ]
    )
    return "\n".join(lines)


def _project_array_bounds(source):
    declaration = "export const PROJECTS: Project[] = ["
    start = source.find(declaration)
    if start < 0:
        raise PortfolioUpdateError(
            "Could not find the PROJECTS array in src/data/portfolio.ts."
        )

    array_start = start + len(declaration)
    array_end = source.find("\n];", array_start)
    if array_end < 0:
        raise PortfolioUpdateError(
            "Could not find the end of the PROJECTS array in src/data/portfolio.ts."
        )
    return array_start, array_end


def _require_portfolio_file(portfolio_path):
    path = Path(portfolio_path)
    if not path.is_file():
        raise PortfolioUpdateError(
            f"This branch does not contain src/data/portfolio.ts at '{path}'."
        )
    return path


def _atomic_write_text(path, content):
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            temporary_file.write(content)
            temporary_file.flush()
            os.fsync(temporary_file.fileno())

        os.chmod(temporary_path, path.stat().st_mode)
        os.replace(temporary_path, path)
    except OSError as error:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
        raise PortfolioUpdateError(
            f"Could not safely update '{path}': {error}"
        ) from error


def append_project_to_portfolio(portfolio_path, project):
    """Append a project to PROJECTS and return the new project count."""
    path = _require_portfolio_file(portfolio_path)

    source = path.read_text(encoding="utf-8")
    array_start, array_end = _project_array_bounds(source)
    array_body = source[array_start:array_end]
    canonical_repo = re.sub(
        r"\.git$",
        "",
        project.github_url.rstrip("/"),
        flags=re.IGNORECASE,
    ).lower()
    existing_repositories = {
        re.sub(r"\.git$", "", value.rstrip("/"), flags=re.IGNORECASE).lower()
        for value in re.findall(r"githubUrl:\s*['\"]([^'\"]+)['\"]", array_body)
    }
    if canonical_repo in existing_repositories:
        raise PortfolioUpdateError(
            f"A project for '{project.github_url}' already exists in portfolio.ts."
        )

    existing_project_ids = set(
        re.findall(r"\bid:\s*['\"]([^'\"]+)['\"]", array_body)
    )
    if project.id in existing_project_ids:
        raise PortfolioUpdateError(
            f"The project id '{project.id}' already exists in portfolio.ts."
        )

    existing_ids = [
        int(value)
        for value in re.findall(r"sysId:\s*['\"]SYS\.(\d+)['\"]", array_body)
    ]
    next_number = max(existing_ids, default=0) + 1
    sys_id = f"SYS.{next_number:03d}"
    rendered = _render_project_entry(project, sys_id)

    updated_body = array_body.rstrip()
    if updated_body:
        updated_body += "\n" if updated_body.endswith(",") else ",\n"
    else:
        updated_body = "\n"
    updated_body += rendered
    updated = source[:array_start] + updated_body + source[array_end:]

    total = len(existing_ids) + 1
    updated, stats_replacements = re.subn(
        r"(deployedProjects:\s*)\d+",
        rf"\g<1>{total}",
        updated,
        count=1,
    )
    if stats_replacements != 1:
        raise PortfolioUpdateError(
            "Could not update PERSONAL_INFO.stats.deployedProjects in portfolio.ts."
        )

    updated, bio_replacements = re.subn(
        r"With \d+\+ deployed production units",
        f"With {total}+ deployed production units",
        updated,
        count=1,
    )
    if bio_replacements != 1:
        raise PortfolioUpdateError(
            "Could not update the deployed-project count in the portfolio bio."
        )

    _atomic_write_text(path, updated)
    return total

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
    clean = repo_input.strip().strip("'\"").rstrip("/")
    if not clean or re.search(r"\s|[\x00-\x1f\x7f]", clean):
        return None, None

    if re.match(r"https?://", clean, flags=re.IGNORECASE):
        parsed = urlparse(clean)
        if parsed.scheme.lower() not in {"http", "https"}:
            return None, None
        if (parsed.hostname or "").lower() not in {"github.com", "www.github.com"}:
            return None, None
        if parsed.query or parsed.fragment:
            return None, None
        parts = [part for part in parsed.path.split("/") if part]
    else:
        without_host = re.sub(
            r"^(?:www\.)?github\.com/",
            "",
            clean,
            flags=re.IGNORECASE,
        )
        if "://" in without_host:
            return None, None
        parts = without_host.split("/")

    if len(parts) != 2:
        return None, None
    owner, repo = parts
    repo = re.sub(r"\.git$", "", repo, flags=re.IGNORECASE)
    if not re.fullmatch(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})", owner):
        return None, None
    if not re.fullmatch(r"[A-Za-z0-9._-]+", repo) or repo in {".", ".."}:
        return None, None
    return owner, repo


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


def _clean_image_stem(filename):
    stem = Path(filename).stem.lower().replace("_preview", "").replace("-preview", "")
    return re.sub(r"[^a-z0-9]", "", stem)


def find_matching_image(repo_name, images_dir=IMAGES_DIR):
    """Return an exact public image match, or the branch placeholder."""
    directory = Path(images_dir)
    if not directory.is_dir():
        raise PortfolioUpdateError(f"Could not find the image directory at '{directory}'.")

    clean_target = re.sub(r"[^a-z0-9]", "", repo_name.lower())
    supported = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
    for candidate in sorted(directory.iterdir()):
        if candidate.is_file() and candidate.suffix.lower() in supported:
            if _clean_image_stem(candidate.name) == clean_target:
                return f"images/{candidate.name}"

    placeholder = directory / "project-placeholder.svg"
    if placeholder.is_file():
        return "images/project-placeholder.svg"
    raise PortfolioUpdateError(
        "No matching preview image or public/images/project-placeholder.svg was found."
    )


def resolve_image_reference(repo_name, override_image=None, images_dir=IMAGES_DIR):
    """Validate an image reference served by Vite's public/images directory."""
    if not override_image:
        return find_matching_image(repo_name, images_dir)

    normalized = override_image.strip().replace("\\", "/")
    if normalized.startswith("public/images/"):
        normalized = normalized[len("public/"):]
    elif "/" not in normalized:
        normalized = f"images/{normalized}"

    if not normalized.startswith("images/") or ".." in Path(normalized).parts:
        raise PortfolioUpdateError(
            "Preview images must be files inside public/images."
        )

    filename = normalized[len("images/"):]
    relative_path = Path(filename)
    supported = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
    if (
        not filename
        or relative_path.is_absolute()
        or relative_path.suffix.lower() not in supported
    ):
        raise PortfolioUpdateError(
            "Preview images must be supported files inside public/images."
        )

    image_root = Path(images_dir).resolve()
    candidate = (image_root / relative_path).resolve()
    try:
        candidate.relative_to(image_root)
    except ValueError as error:
        raise PortfolioUpdateError(
            "Preview images must stay inside public/images."
        ) from error

    if not candidate.is_file():
        raise PortfolioUpdateError(
            f"Preview image '{normalized}' does not exist in public/images."
        )
    return f"images/{relative_path.as_posix()}"


def _comma_separated(value):
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _project_slug(value):
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if not slug:
        raise PortfolioUpdateError("Could not derive a project id from the project name.")
    return slug


def _validated_web_url(value, field_name, required=False):
    clean = (value or "").strip()
    if not clean:
        if required:
            raise PortfolioUpdateError(f"{field_name} is required.")
        return None
    parsed = urlparse(clean)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
        raise PortfolioUpdateError(
            f"{field_name} must be an http:// or https:// URL."
        )
    return clean


def _required_detail(value, label, flag, interactive):
    clean = (value or "").strip()
    if clean:
        return clean
    if interactive:
        clean = input(f"{CYAN}? {label}{RESET}: ").strip()
    if not clean:
        raise PortfolioUpdateError(
            f"{label} is required. Pass {flag} when running non-interactively."
        )
    return clean


def _inferred_technologies(repo_data):
    values = []
    language = (repo_data.get("language") or "").strip()
    if language:
        values.append(language)
    for topic in repo_data.get("topics") or []:
        formatted = split_camel_case_name(topic)
        if formatted and formatted.lower() not in {value.lower() for value in values}:
            values.append(formatted)
    return values[:5]


def process_repo(
    repo_input,
    override_name=None,
    override_live=None,
    override_desc=None,
    override_category=None,
    override_image=None,
    override_problem=None,
    override_features=None,
    override_technologies=None,
    featured=True,
    portfolio_path=PORTFOLIO_PATH,
    images_dir=IMAGES_DIR,
    repo_data=None,
    interactive=None,
):
    """Fetch repository metadata and append a Project to portfolio.ts."""
    owner, repo_name = parse_repo_identifier(repo_input)
    if not owner or not repo_name:
        raise PortfolioUpdateError(
            f"Invalid repository format '{repo_input}'. Use "
            "https://github.com/owner/repo or owner/repo."
        )

    portfolio_path = _require_portfolio_file(portfolio_path)
    is_interactive = sys.stdin.isatty() if interactive is None else interactive
    if repo_data is None:
        print(
            f"\n{CYAN}⚡ Fetching metadata from GitHub repository:{RESET} "
            f"{BOLD}{owner}/{repo_name}{RESET}..."
        )
        repo_data = fetch_github_repo_data(owner, repo_name)

    final_name = (override_name or split_camel_case_name(repo_data["name"])).strip()
    final_description = (
        override_desc
        or (repo_data.get("description") or "").strip()
        or f"Production-grade {final_name} application."
    )
    final_problem = _required_detail(
        override_problem,
        "Problem solved",
        "--problem",
        is_interactive,
    )
    features_text = _required_detail(
        override_features,
        "Key features (comma-separated)",
        "--features",
        is_interactive,
    )
    final_features = _comma_separated(features_text)
    if not final_features:
        raise PortfolioUpdateError("At least one key feature is required.")

    inferred_category = infer_category(
        repo_data["name"],
        repo_data.get("description") or "",
        repo_data.get("topics") or [],
        repo_data.get("language") or "",
    )
    category_key = override_category or inferred_category
    _, category_label, _ = CATEGORY_MAP[category_key]

    final_technologies = _comma_separated(override_technologies)
    if not final_technologies:
        final_technologies = _inferred_technologies(repo_data)
    if not final_technologies and is_interactive:
        final_technologies = _comma_separated(
            input(f"{CYAN}? Technologies (comma-separated){RESET}: ").strip()
        )
    if not final_technologies:
        raise PortfolioUpdateError(
            "At least one technology is required. Pass --technologies."
        )

    homepage = override_live
    if homepage is None:
        homepage = (repo_data.get("homepage") or "").strip()
        if homepage and not re.match(r"https?://", homepage, flags=re.IGNORECASE):
            homepage = f"https://{homepage}"
    final_live = _validated_web_url(homepage, "Live demo URL")
    final_repo = _validated_web_url(
        repo_data.get("html_url") or f"https://github.com/{owner}/{repo_name}",
        "Repository URL",
        required=True,
    )
    final_image = resolve_image_reference(repo_name, override_image, images_dir)

    project = ProjectEntry(
        id=_project_slug(final_name),
        title=final_name,
        category=category_key,
        category_label=category_label,
        description=final_description,
        problem_solved=final_problem,
        key_features=tuple(final_features),
        technologies=tuple(final_technologies),
        github_url=final_repo,
        live_url=final_live,
        image=final_image,
        featured=featured,
    )
    total_projects = append_project_to_portfolio(portfolio_path, project)

    print(f"\n{GREEN}{BOLD}✓ Added '{final_name}' to src/data/portfolio.ts.{RESET}")
    print(f"  {CYAN}Repository:{RESET}     {final_repo}")
    if final_live:
        print(f"  {CYAN}Live Demo URL:{RESET}  {final_live}")
    print(f"  {CYAN}Category:{RESET}       {category_label} (`{category_key}`)")
    print(f"  {CYAN}Technologies:{RESET}   {', '.join(final_technologies)}")
    print(f"  {CYAN}Image:{RESET}          {final_image}")
    print(f"  {CYAN}Total Projects:{RESET} {total_projects}\n")
    return total_projects


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Append a GitHub project to the PROJECTS array in "
            "src/data/portfolio.ts."
        )
    )
    parser.add_argument(
        "repo_url",
        nargs="?",
        help=(
            "GitHub repository URL or owner/repo "
            "(e.g. https://github.com/roco007/OpporunityAi)"
        ),
    )

    parser.add_argument("-n", "--name", help="Override project name")
    parser.add_argument("-l", "--live", help="Override live demo URL")
    parser.add_argument("-d", "--desc", help="Override description")
    parser.add_argument(
        "-c",
        "--category",
        choices=["ai", "utility", "interactive"],
        help="Override category",
    )
    parser.add_argument(
        "-i",
        "--image",
        help="Preview filename or images/... path inside public/images",
    )
    parser.add_argument(
        "-p",
        "--problem",
        help="Problem solved by the project (prompted when omitted interactively)",
    )
    parser.add_argument(
        "-f",
        "--features",
        help="Comma-separated key features (prompted when omitted interactively)",
    )
    parser.add_argument(
        "-t",
        "--technologies",
        "--tags",
        dest="technologies",
        help="Comma-separated technologies; --tags is retained as an alias",
    )
    parser.add_argument(
        "--featured",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Mark the project as featured (default: true)",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Fail instead of prompting when required project details are missing",
    )

    args = parser.parse_args()

    repo_input = args.repo_url
    if not repo_input and args.non_interactive:
        print(
            f"{PINK}Error: A GitHub repository argument is required "
            f"with --non-interactive.{RESET}",
            file=sys.stderr,
        )
        return 2
    if not repo_input:
        print(f"\n{CYAN}{BOLD}╔═══════════════════════════════════════════════════════════╗{RESET}")
        print(f"{CYAN}{BOLD}║          PORTFOLIO.TS // PROJECT INGESTOR                 ║{RESET}")
        print(f"{CYAN}{BOLD}╚═══════════════════════════════════════════════════════════╝{RESET}\n")
        try:
            repo_input = input(f"{CYAN}? Enter GitHub Repository Link{RESET} (e.g. https://github.com/roco007/justDoIt): ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nOperation cancelled.")
            sys.exit(0)

    if not repo_input:
        print(f"{PINK}Error: Repository link is required.{RESET}")
        return 1

    try:
        process_repo(
            repo_input=repo_input,
            override_name=args.name,
            override_live=args.live,
            override_desc=args.desc,
            override_category=args.category,
            override_image=args.image,
            override_problem=args.problem,
            override_features=args.features,
            override_technologies=args.technologies,
            featured=args.featured,
            interactive=False if args.non_interactive else None,
        )
    except PortfolioUpdateError as error:
        print(f"{PINK}Error: {error}{RESET}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
