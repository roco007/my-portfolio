# Project: Build a Premium, Interactive Developer Portfolio Using Anime.js

## 1. Your Role

Act as a senior frontend engineer, creative developer, UI/UX designer, motion designer, and technical SEO specialist.

Your task is to **research my existing portfolio, extract my professional information and projects, and build an entirely new portfolio website from scratch**.

The final result should feel like a premium, interactive digital experience rather than a generic developer portfolio template.

Prioritize:
- Exceptional visual design.
- Advanced, purposeful animations using Anime.js.
- Smooth interactions and transitions.
- Professional presentation of my technical experience.
- High performance and accessibility.
- Responsive design across desktop, tablet, and mobile.
- Easy maintenance and future expansion.

Do not merely redesign the existing website's CSS. Build a new experience with its own visual identity, layout, components, animation system, and implementation.

---

## 2. Source of Truth: My Existing Portfolio

Start by visiting and thoroughly analyzing my existing portfolio:

**Portfolio URL:** https://roco007.github.io/my-portfolio/

Use this website as the primary source of truth for my personal information, professional background, projects, skills, and existing links.

### Research requirements

Before writing code:

1. Inspect every accessible page and section of my existing portfolio.
2. Extract my name, professional headline, biography, technical skills, work experience, projects, achievements, and contact information.
3. Record all project names, descriptions, technologies, GitHub repositories, and live demonstrations.
4. Identify all social profiles and professional links.
5. Inspect any available images, logos, illustrations, and other assets.
6. Identify existing content that should be retained, improved, reorganized, or removed.
7. Verify links where possible.
8. Identify missing information rather than inventing it.

Use my GitHub profile as a supplementary source:

https://github.com/roco007

Explore my public repositories to discover projects that may not be represented adequately on the existing portfolio.

Repositories worth checking include:

- css-to-tailwind
- instantQrGenerator
- jsonTools
- regexCompare
- sqlOptimizer
- yamlTools

These are starting points, not an exhaustive list. Discover other relevant repositories and determine which projects deserve prominent placement.

### Data integrity rules

- Preserve factual information about my professional experience.
- Do not invent employers, clients, job titles, qualifications, metrics, achievements, or project capabilities.
- Do not assume that a repository has a production-ready implementation without inspecting it.
- Clearly distinguish verified information from information that needs confirmation.
- Preserve valid existing links.
- Do not publish private information or secrets.
- If a detail cannot be verified, omit it or use an obvious placeholder.

Create a centralized content configuration so that I can update my portfolio without rewriting its components.

For example:

`src/data/portfolio.ts`

The configuration should contain personal information, social links, skills, experience, and project data.

---

## 3. Define the Visual Direction

Design an original, visually distinctive portfolio.

Avoid generic layouts that look like a standard AI-generated website, including repetitive rounded cards, excessive gradients, oversized decorative blobs, and animations that serve no purpose.

### Creative direction

Aim for a combination of:

- Premium digital product design.
- Editorial typography.
- Contemporary developer aesthetics.
- Minimalist layouts with strong visual hierarchy.
- Cinematic transitions.
- Interactive typography.
- Carefully controlled motion.
- Subtle technical details inspired by code, interfaces, and digital systems.

Use the existing portfolio's actual content to inform the design, but do not feel constrained by its original layout.

### Visual system

Develop a coherent design system containing:

- A defined color palette.
- A consistent typographic scale.
- Reusable spacing tokens.
- Responsive layout rules.
- A consistent icon system.
- Hover, focus, active, and disabled states.
- A consistent animation language.
- Light and dark theme support if it enhances the experience.

Use strong contrast and readable typography.

Avoid using visual effects simply because they are trendy. Every element should support the content or the overall experience.

### Initial design exploration

Before implementation, establish:

1. The overall visual concept.
2. The page structure.
3. The typography and color palette.
4. The animation direction.
5. The project-card design.
6. The mobile experience.

Then proceed with the strongest cohesive direction instead of creating disconnected visual styles for different sections.

---

## 4. Technology Stack

Use a modern, maintainable frontend stack.

Preferred technologies:

- React
- TypeScript
- Vite
- Anime.js
- CSS Modules or a well-organized global CSS architecture
- Lucide icons or another consistent icon library

Use the current stable Anime.js release and consult its official documentation before implementation.

Official Anime.js website:

https://animejs.com/

Official documentation:

https://animejs.com/documentation/

Check the installed version and use the API appropriate to that version. Do not mix APIs from different major versions.

Use semantic HTML, reusable React components, and TypeScript types.

Avoid unnecessary dependencies. Every additional library should have a clear purpose.

If the existing repository has an established stack, inspect it first and make an informed decision about whether to preserve or replace it.

---

## 5. Website Architecture

Build a polished, single-page portfolio with clear navigation and well-structured sections.

You may adapt the order based on the design, but the following content must be considered.

### A. Navigation

Create a clean, responsive navigation system.

Requirements:

- Minimal desktop navigation.
- Compact mobile navigation.
- Smooth section navigation.
- Active-section indication.
- A distinctive visual treatment for the primary contact action.
- Optional theme switcher.
- Optional scroll-progress indicator if it complements the design.

The navigation should remain usable while animations are running.

Use appropriate keyboard interactions and accessible labels.

### B. Hero Section

The hero should immediately communicate who I am, what I build, and why someone should explore my work.

Include verified information from my existing portfolio.

Potential elements:

- My name.
- My professional title.
- A concise introduction.
- A primary CTA leading to projects.
- A secondary CTA for contacting me or viewing my resume, if available.
- Links to verified professional profiles.
- A distinctive visual element that creates a memorable first impression.

Use Anime.js to choreograph the initial presentation.

Possible animation sequence:

1. A refined loading or introduction transition, if justified.
2. Subtle background or interface movement.
3. Staggered headline reveals.
4. Supporting text entering with carefully timed motion.
5. CTA buttons appearing in sequence.
6. A restrained ambient animation that continues after the introduction.

Do not make visitors wait through a long splash screen.

The primary content should become available quickly, and users who prefer reduced motion should receive a suitable alternative.

### C. About Section

Present my professional background in a concise, engaging format.

Use the verified source content to explain:

- My professional experience.
- The technologies I work with.
- The types of problems I solve.
- My development interests.
- My approach to building software.

Do not fabricate a personal story or exaggerate my experience.

Consider a visually interesting editorial layout instead of a conventional biography card.

### D. Technical Skills

Organize verified technologies into sensible categories.

Possible categories include:

- Frontend development.
- Backend development.
- Programming languages.
- Databases.
- Developer tools.
- AI-assisted development.
- Other verified areas of expertise.

Use only technologies supported by the available information.

Possible interactions:

- Subtle staggered entrance animations.
- Animated category transitions.
- Interactive technology labels.
- Contextual hover details.

Do not invent skill percentages, proficiency scores, or years of experience for individual technologies.

Keep the presentation informative rather than turning it into an unnecessary animation showcase.

### E. Featured Projects

This should be one of the strongest sections of the website.

Inspect the available repositories and select the most compelling projects based on their actual implementation, usefulness, completeness, and relevance.

Each project should support the information available from its source.

Potential fields:

- Project name.
- Concise description.
- Problem addressed.
- Key features.
- Technologies used.
- GitHub repository.
- Live demonstration.
- Preview image or screenshot, when available.

Do not invent missing links, capabilities, or results.

#### Project presentation

Create a visually engaging project gallery with varied layouts where appropriate.

Use Anime.js for interactions such as:

- Staggered project reveals.
- Image or preview transitions.
- Subtle hover movement.
- Animated metadata.
- Section-level transitions.
- Interactive filtering, if there are enough projects to justify it.

Keep hover animations restrained and ensure touch devices have equivalent ways to access important information.

Use real project screenshots when available. Do not substitute unrelated stock imagery for actual project previews.

If a screenshot is unavailable, create a deliberate typographic or interface-based project preview instead.

Every project card should make its available source-code and live-demo links easy to find.

Do not display a live-demo button when no valid demonstration exists.

### F. Professional Experience

Use verified work-history information from my existing portfolio.

Present relevant roles, employers, dates, and responsibilities in a clear visual hierarchy.

A timeline, editorial list, or structured experience layout is acceptable.

Use restrained Anime.js transitions to reveal experience entries as visitors scroll.

Never invent dates, promotions, responsibilities, client relationships, or quantified business outcomes.

### G. Contact Section

Create a clear, professional way for visitors to contact me.

Include verified contact methods and social links from the source material.

Potential features:

- Email CTA.
- Professional profile links.
- GitHub link.
- Copy-email interaction.
- A contact form only if a real submission mechanism can be implemented.

If implementing a form, provide validation, accessible feedback, loading states, and success or error messages.

Do not create a fake contact form that appears to submit messages but does nothing.

Never expose API keys, email-service credentials, or other secrets in client-side code.

### H. Footer

Include:

- My verified identity or brand.
- Relevant navigation.
- Verified social links.
- A dynamically generated copyright year.
- A subtle closing interaction if it complements the design.

Keep the footer simple and consistent with the rest of the website.

---

## 6. Anime.js: Core Animation Requirements

Anime.js is a central requirement, not an optional enhancement.

Use it to create a coherent motion system across the website.

Consult the official documentation and implement animations using the supported APIs of the installed version.

Do not simply add a few fade-in effects and claim the website has advanced animation.

### Animation 1: Initial Page Entrance

Create a carefully choreographed hero entrance.

Use staggered timing for suitable text and interface elements.

The result should feel smooth, intentional, and professional.

Avoid excessive bounce, elastic movement, and unnecessary delays.

### Animation 2: Text Reveals

Implement high-quality headline reveals.

Possible approaches include:

- Line-based reveals.
- Word-by-word staggered motion.
- Clipped text transitions.
- Subtle character animation for short text.

Use semantic markup and preserve readable text for assistive technologies.

Do not animate every paragraph character by character.

### Animation 3: Scroll-Triggered Sections

Reveal important sections as they enter the viewport.

Requirements:

- Avoid repeatedly replaying every animation during small scroll movements.
- Avoid hiding content indefinitely if an animation fails.
- Ensure content remains accessible.
- Clean up observers and animation instances appropriately.
- Prevent layout shifts caused by animation initialization.

### Animation 4: Project Interactions

Create polished project-card interactions.

Examples:

- A subtle image scale.
- A restrained elevation or translation effect.
- Animated metadata.
- A visual indication that a project is interactive.
- A transition into project details if that experience is implemented.

The interaction must not make important links difficult to click or read.

### Animation 5: Navigation and Section Transitions

Use smooth navigation and suitable transitions between interface states.

Respect browser history and URL behavior.

Do not prevent normal scrolling or keyboard navigation.

### Animation 6: Ambient Motion

Introduce optional, subtle ambient motion where it adds visual depth.

Potential examples:

- Moving grid lines.
- Slowly shifting interface elements.
- A restrained cursor-following accent.
- A decorative technical visualization.

Avoid resource-intensive effects that harm scrolling, battery life, or mobile performance.

### Animation 7: Microinteractions

Use subtle motion for:

- Buttons.
- Navigation links.
- Theme changes.
- Copy-email feedback.
- Project filters.
- Menu open and close states.

Microinteractions should communicate feedback rather than merely decorate the interface.

### Animation 8: Loading and Completion States

Where useful, animate asynchronous interface states, such as loading GitHub project metadata or submitting a contact form.

Do not introduce artificial loading delays.

Do not make essential portfolio content dependent on third-party API availability.

---

## 7. Animation Engineering Rules

Follow these rules throughout implementation.

### Performance

- Prefer transform and opacity animations when appropriate.
- Avoid unnecessary layout recalculations.
- Avoid animating large numbers of DOM elements simultaneously.
- Avoid expensive blur and filter animations on mobile.
- Keep the page responsive while animations execute.
- Clean up event listeners, observers, and animation instances.
- Avoid duplicate animations caused by repeated React effects.
- Test React component mounting and unmounting.
- Use lazy loading for appropriate images and below-the-fold media.

### Accessibility

Support `prefers-reduced-motion`.

When reduced motion is enabled:

- Disable nonessential ambient movement.
- Reduce or remove large translations and elaborate transitions.
- Keep content visible and usable.
- Preserve functionality and navigation.

Ensure focus indicators remain visible and interactive elements are keyboard accessible.

### Robustness

- No animation should permanently hide content.
- Do not depend on animations to reveal essential information.
- Handle missing images and unavailable external data gracefully.
- Ensure the website still works when JavaScript animation initialization fails wherever reasonably possible.

### Animation architecture

Create reusable animation utilities or hooks rather than implementing every animation independently.

Keep animation logic separate from content data and presentation styles.

Use clear names and comments to explain non-obvious animation behavior.

---

## 8. Responsive Design

The website must work well across:

- Large desktop screens.
- Standard laptop screens.
- Tablets.
- Mobile phones.

Do not treat responsiveness as a final CSS patch.

Design the mobile experience intentionally.

Requirements:

- No horizontal overflow.
- No clipped text.
- No overlapping animated elements.
- Appropriate font sizes and spacing.
- Usable project cards.
- Touch-friendly controls.
- Accessible navigation.
- Good performance on mid-range mobile devices.

Adapt or disable decorative animations on smaller screens when appropriate.

Test portrait and landscape layouts where relevant.

---

## 9. SEO and Social Sharing

Implement the technical SEO fundamentals.

Include:

- A meaningful page title.
- A unique meta description.
- A canonical URL where appropriate.
- Open Graph metadata.
- Social sharing metadata.
- Semantic heading structure.
- Descriptive image alt text.
- A favicon.
- A valid sitemap and robots configuration when appropriate for the deployment.
- Structured data only when the information is accurate and applicable.

Use verified information when generating metadata.

Ensure the page remains understandable to search engines even if animation libraries fail to initialize.

Avoid keyword stuffing.

---

## 10. Performance and Code Quality

Treat the website as a production project.

Requirements:

- Clean component architecture.
- Strong TypeScript typing.
- Consistent formatting.
- Reusable components.
- Centralized content configuration.
- No unnecessary dependencies.
- No console errors.
- No broken internal links.
- No dead buttons.
- No placeholder interactions presented as completed features.
- No exposed secrets.
- No unnecessary API calls.

Optimize images and fonts.

Avoid loading large libraries or assets when they are not needed.

Use sensible code splitting or lazy loading when appropriate.

The application should be easy to understand and modify.

---

## 11. Suggested Project Structure

Use a structure similar to the following, adapting it to the selected architecture:

```text
portfolio/
├── public/
│   ├── favicon.svg
│   ├── images/
│   └── resume/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Button.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── SectionHeading.tsx
│   │   └── ThemeToggle.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Skills.tsx
│   │   ├── Projects.tsx
│   │   ├── Experience.tsx
│   │   ├── Contact.tsx
│   │   └── Footer.tsx
│   ├── animations/
│   │   ├── entrance.ts
│   │   ├── scroll.ts
│   │   ├── interactions.ts
│   │   └── useReducedMotion.ts
│   ├── data/
│   │   └── portfolio.ts
│   ├── styles/
│   │   ├── globals.css
│   │   ├── tokens.css
│   │   └── animations.css
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

This is a suggested organization, not a rigid requirement.

Avoid creating unnecessary files or components that add complexity without improving maintainability.

---

## 12. Implementation Workflow

Work through the project in the following order.

### Phase 1: Research

- Inspect the existing portfolio.
- Inspect my GitHub profile and relevant repositories.
- Extract verified content.
- Inventory available assets.
- Record the links and facts that will appear on the new website.

Deliverable: A concise content inventory and implementation plan.

### Phase 2: Design

- Define the creative direction.
- Establish the design tokens.
- Plan the page layout.
- Define the animation language.
- Consider desktop and mobile layouts.

Deliverable: A coherent design plan that guides the implementation.

### Phase 3: Project Setup

- Initialize the application if necessary.
- Install the required dependencies.
- Configure TypeScript and the build system.
- Establish the project structure.
- Configure Anime.js using the installed version's documented APIs.

Do not overwrite unrelated files or existing work without inspecting the project first.

### Phase 4: Core Implementation

Build the complete page structure and implement the actual portfolio content.

Ensure every section works before adding complex animation sequences.

### Phase 5: Animation Implementation

Add the Anime.js motion system.

Implement entrance animations, scroll reveals, project interactions, navigation transitions, and appropriate microinteractions.

Test animation cleanup and reduced-motion behavior.

### Phase 6: Responsive Refinement

Test different viewport sizes.

Fix layout issues, text overflow, touch interactions, and mobile animation performance.

### Phase 7: Quality Assurance

Run the available checks, including:

- Production build.
- TypeScript checks.
- Linting, if configured.
- Browser console inspection.
- Link verification.
- Responsive layout checks.
- Keyboard navigation checks.
- Reduced-motion checks.
- Basic accessibility review.
- Performance inspection.

Fix discovered issues instead of merely documenting them.

### Phase 8: Documentation and Delivery

Create a README that explains:

- Project overview.
- Technology stack.
- Installation.
- Local development.
- Production build.
- Project structure.
- How to update portfolio content.
- How to add a project.
- How to change the theme.
- How to customize animations.
- Deployment instructions.

Provide the exact commands needed to run and build the project.

---

## 13. Deployment

Prepare the website for deployment.

My existing portfolio is hosted on GitHub Pages, so consider GitHub Pages compatibility as the default deployment target.

If using Vite:

- Configure the correct base path for the intended deployment URL.
- Ensure assets resolve correctly after deployment.
- Verify client-side routing behavior if routing is introduced.
- Configure a GitHub Actions workflow if needed.
- Document the deployment process.

Do not assume the new website will automatically deploy to the existing URL without the required repository and hosting configuration.

If deploying to another hosting platform would materially improve the result, explain the trade-offs, but keep the project deployable to GitHub Pages where practical.

Never publish deployment credentials or secrets in the repository.

---

## 14. Definition of Done

The project is complete only when the following conditions are met:

1. The existing portfolio has been inspected and its verified information extracted.
2. Relevant GitHub projects have been researched.
3. The new website has a distinct visual identity.
4. All major portfolio sections are implemented.
5. Anime.js is genuinely integrated and used for meaningful interactions.
6. The animations are smooth and do not obstruct content.
7. Reduced-motion preferences are supported.
8. The website is responsive.
9. All displayed links have been verified where possible.
10. There are no knowingly broken buttons or fake interactions.
11. The production build succeeds.
12. The website has appropriate SEO and accessibility fundamentals.
13. The README explains how to run, maintain, and deploy the project.
14. The result is ready for local testing and deployment.

Do not stop after producing a design concept, wireframe, screenshot, or code outline.

**Implement the complete working website.**

If the current environment supports browser automation, use it to inspect the reference website and test the new implementation.

If something cannot be verified or tested in the available environment, state that limitation honestly.

---

## 15. Final Instruction

Build this portfolio as if it will be evaluated by experienced engineering managers, technical recruiters, frontend engineers, and design-conscious developers.

The website should communicate technical credibility through both its content and its implementation.

Use animation to make the experience memorable, not distracting.

Prioritize craftsmanship, clarity, authenticity, accessibility, and performance.

**Begin by researching the existing portfolio and relevant GitHub repositories. Then implement the new website from scratch, validate it, and deliver the complete project.**