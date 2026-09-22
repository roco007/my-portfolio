# Raj Colaco // Futuristic AI Portfolio

Cybernetic, next-generation AI developer portfolio featuring interactive neural particle constellations, 3D holographic card physics, cyber text decryption, category filtering, and telemetry HUD metrics.

---

## 🚀 Adding a New Project (`add_project.py`)

A script [`add_project.py`](file:///Users/raj.colaco/Desktop/PersonalGit/my-portfolio/add_project.py) automatically ingests and generates new project cards using **just 1 input: your GitHub repository link**.

When a project is added, it is placed **at the top of the grid (before existing cards)**, automatically renumbers all system chips (`SYS.001`, `SYS.002`, ...), and updates the `DEPLOYED UNITS` count in the telemetry HUD.

### 🌟 1-Input Mode (Pass GitHub Repo URL)
Simply provide the GitHub repository URL:
```bash
python3 add_project.py https://github.com/roco007/OpporunityAi
```
*(or run `python3 add_project.py` and paste the URL when prompted)*

#### How It Works:
1. **Name**: Automatically derived from the repo name by splitting camelCase / PascalCase:
   - `justDoIt` or `JustDoIt` → **Just Do It**
   - `OpporunityAi` → **Opporunity AI**
   - `interactive-solar-system` → **Interactive Solar System**
2. **Description**: Automatically fetched from the GitHub repository **About** section.
3. **Live Demo URL**: Automatically fetched from the website link in the GitHub repository **About** section.
4. **Category & Tags**: Automatically inferred from repository topics, primary language, and description keywords.
5. **Image**: Automatically matches any corresponding preview image in `assets/images/`.

---

### Optional Manual Overrides
If you ever want to override any specific detail, you can optionally pass flags:
```bash
python3 add_project.py https://github.com/roco007/OpporunityAi \
  --name "Opportunity AI" \
  --image "assets/images/OpportunityAI_preview.png"
```

Available override flags:
- `-n`, `--name`: Override project title
- `-l`, `--live`: Override live demo URL
- `-d`, `--desc`: Override description
- `-c`, `--category`: Override category (`ai`, `utility`, `interactive`)
- `-t`, `--tags`: Override tags (comma-separated)
- `-i`, `--image`: Override image path or filename