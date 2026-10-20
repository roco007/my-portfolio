# Upgrade Portfolio Background: Spaceship Window Through Deep Space

You are modifying my existing portfolio website.

First, **inspect the entire existing codebase and understand the current visual design, layout, animations, component structure, and performance characteristics before making any changes.**

The website already has a futuristic, dark, AI/technology-oriented aesthetic.

Your task is to transform the current background into a **cinematic deep-space environment that makes the user feel as if the portfolio itself is a window/view screen inside a moving spaceship.**

Do NOT redesign the website itself.

Do NOT replace the existing UI.

Do NOT make the background overpower the portfolio content.

The existing portfolio UI must remain clearly readable and visually dominant.

---

# 1. CORE CONCEPT

The user should feel like:

> **They are sitting inside a futuristic spaceship, looking through a large observation window into space while the ship continuously travels through the universe.**

The portfolio UI is effectively the **interior interface of the spaceship**.

Behind/around the interface is a constantly moving cosmic environment.

The spaceship itself does not necessarily need to be explicitly visible.

Instead, create the illusion through:

- A large space-view background
- Subtle window/frame effects
- Parallax
- Moving stars
- Passing planets
- Nebulae
- Solar systems
- Asteroids/debris
- Distant galaxies
- Lighting changes
- Occasional large celestial objects passing the window

The result should feel like a **cinematic spaceship navigation window**, not a normal website background.

---

# 2. 1-HOUR JOURNEY

Create a **continuous 60-minute virtual journey through space**.

The journey should follow a predefined route.

Conceptually:

SPACE STATION
↓
DEEP SPACE
↓
MERCURY
↓
VENUS
↓
EARTH
↓
MARS
↓
JUPITER
↓
SATURN
↓
URANUS
↓
NEPTUNE
↓
SUN
↓
STAR FIELD
↓
KNOWN STARS
↓
NEBULA
↓
GALAXY / DEEP SPACE
↓
ASTEROID FIELD
↓
DEEP SPACE
↓
LOOP BACK TO START

This is not intended to represent a scientifically accurate spacecraft trajectory.

It is an **artistic cinematic route inspired by the Solar System and recognizable astronomical objects.**

The route must continuously progress for approximately:

**60 minutes**

At exactly/approximately the 60-minute boundary, the journey should smoothly return to the beginning.

Avoid an obvious hard cut.

The transition from the end of the journey back to the beginning should be designed to feel like the ship has entered a wormhole / hyperspace transition / deep-space jump.

---

# 3. PLANET SEQUENCE

Include recognizable representations of the major Solar System planets.

At appropriate points in the journey, the spaceship should pass by:

### Mercury
Small rocky planet.

### Venus
Dense yellow/orange atmosphere.

### Earth
Blue oceans, visible continents/cloud systems.

### Mars
Red/orange surface.

### Jupiter
Extremely large gas giant with:

- Cloud bands
- Great Red Spot
- Several visible moons if performance permits

### Saturn
Extremely important visual landmark.

Include:

- Prominent rings
- Atmospheric bands
- Moons if feasible

### Uranus
Blue/green ice giant.

### Neptune
Deep blue ice giant.

### Sun
The Sun should appear later in the journey as an enormous luminous celestial object.

Do NOT simply use flat 2D images of planets.

Prefer:

- WebGL
- Three.js
- CSS 3D where appropriate
- Canvas
- procedural shaders
- optimized textures

Use whatever technology best fits the existing project.

---

# 4. PLANETS MUST ROTATE

This is critical.

Every planet must have continuous rotation.

The user should never see a static planet.

For example:

Earth:

- Clouds rotate with the planet
- Continents slowly move across the visible surface
- Day/night terminator changes naturally

Jupiter:

- Cloud bands rotate at different speeds if technically feasible
- Great Red Spot moves naturally

Saturn:

- Planet rotates
- Rings rotate/orbit appropriately

The motion should be slow enough to feel realistic.

Avoid arcade-game-style rotation.

---

# 5. CAMERA / SPACESHIP MOVEMENT

The camera represents the viewpoint of the spaceship.

The spaceship is continuously moving forward through space.

Do NOT simply move planets toward the camera on a straight line.

The camera path should have subtle cinematic movement:

- Forward motion
- Gentle banking
- Small horizontal movements
- Slight vertical movement
- Occasional turns
- Gradual changes in direction

The movement should feel like a massive spacecraft cruising through space.

Avoid:

- Excessive camera shake
- Roller-coaster movement
- Fast spinning
- Motion sickness
- Sudden camera jumps

The user should be able to comfortably read the portfolio while the background moves.

---

# 6. DEEP SPACE ENVIRONMENT

Create a rich layered space environment.

The background should contain several depth layers.

### Layer 1 — Distant universe

Very distant:

- stars
- galaxies
- faint nebulae
- cosmic dust

These should move extremely slowly.

### Layer 2 — Mid-distance

Include:

- star clusters
- small planets
- moons
- distant solar systems
- nebula clouds

### Layer 3 — Nearby objects

Occasionally include:

- asteroids
- debris
- spacecraft silhouettes
- satellites
- planetary objects

These should move noticeably faster due to parallax.

---

# 7. STARS

The star field should NOT look like:

> `background-image: radial-gradient(...)`

or a basic random CSS star generator.

Create a genuinely layered 3D star field.

Stars should have:

- Different sizes
- Different brightness levels
- Different distances
- Slight color variations
- Depth
- Parallax

Some stars should be extremely distant and almost stationary.

Others should move noticeably as the spaceship travels.

Occasionally allow a bright star to pass through the viewing area.

Avoid excessive shooting stars.

---

# 8. KNOWN STARS

Include recognizable real stars throughout the journey.

Use well-known stars such as:

- Sirius
- Canopus
- Alpha Centauri
- Vega
- Betelgeuse
- Rigel
- Polaris
- Arcturus
- Procyon
- Aldebaran

Do not make every star a labeled object.

Most should simply appear naturally within the environment.

Occasionally, when the spaceship passes relatively close to a notable star, a very subtle identification effect can appear.

Example:

`SIRIUS`
`−1.46 apparent magnitude`

This should be extremely subtle and should not interfere with the portfolio.

---

# 9. THE SUN

The Sun should be one of the major cinematic moments.

As the spaceship approaches it:

- Ambient space lighting gradually changes
- The Sun grows larger
- The surrounding environment becomes brighter
- Subtle lens flare appears
- Solar glow increases
- The Sun's surface should visibly move
- Solar prominences/flaring should be animated if feasible

Do NOT make the Sun look like a simple orange circle.

It should feel enormous and extremely bright.

The ship should NOT literally fly into the Sun.

Instead, have the route curve around it.

---

# 10. NEBULAE

Introduce large-scale nebula environments.

Examples of visual inspiration:

- Orion Nebula
- Eagle Nebula
- Carina Nebula
- colorful emission nebulae
- dark nebulae

Use procedural effects, textures, shaders, or optimized 3D techniques.

Nebulae should be slow-moving.

They should create cinematic transitions between planetary regions.

---

# 11. ASTEROID FIELD

Include at least one section where the spaceship passes through an asteroid field.

Asteroids should have:

- Different sizes
- Irregular shapes
- Different rotations
- Different distances
- Realistic parallax

The ship should pass through the field rather than collide with anything.

Keep the density controlled so it doesn't become visually distracting.

---

# 12. SPACE WINDOW EFFECT

The most important conceptual detail:

**Make it feel like the user is looking through a spaceship window.**

Do not simply put a black space background behind the website.

Create a subtle visual boundary around the viewport.

Possible effects:

- Dark metallic edges
- Subtle HUD framing
- Slight glass reflection
- Very subtle glass distortion
- Soft vignette
- Interior lighting
- Small reflections

The website content should feel like it exists **inside the spaceship**.

Do NOT add a huge literal spaceship cockpit around the entire website.

Keep it elegant and minimal.

---

# 13. GLASS / WINDOW REFLECTION

Add extremely subtle glass characteristics.

For example:

- faint reflection streaks
- subtle transparency
- occasional light reflection
- very slight bloom

These effects should only become noticeable when a bright object such as the Sun or a planet passes nearby.

---

# 14. CINEMATIC EVENTS

Create occasional events throughout the one-hour route.

Examples:

### Event A
A large planet slowly enters the viewport.

### Event B
A moon passes between the camera and a planet.

### Event C
The spaceship enters a nebula.

### Event D
An asteroid field appears.

### Event E
The Sun becomes visible.

### Event F
A bright star passes nearby.

### Event G
A distant galaxy becomes visible.

### Event H
Hyperspace transition begins near the end.

These events should happen organically.

Do not create a predictable repeating animation every 10 seconds.

---

# 15. ONE-HOUR TIMELINE

Create a deterministic timeline.

Example structure:

```text
00:00 – 05:00
Departure / star field

05:00 – 10:00
Mercury / Venus

10:00 – 15:00
Earth

15:00 – 20:00
Mars

20:00 – 27:00
Jupiter

27:00 – 34:00
Saturn

34:00 – 38:00
Uranus

38:00 – 42:00
Neptune

42:00 – 47:00
Deep space / notable stars

47:00 – 52:00
Sun encounter

52:00 – 56:00
Nebula / asteroid field

56:00 – 59:00
Deep space / galaxy

59:00 – 60:00
Hyperspace transition

60:00
Smoothly return to 00:00
```

You may adjust these timings if necessary to make the experience visually better.

The important requirement is that the complete journey takes **one hour**.

---

# 16. LOOPING

The animation must loop indefinitely.

Conceptually:

```text
Journey 1
0 → 60 minutes

Journey 2
0 → 60 minutes

Journey 3
0 → 60 minutes
```

Do not reload the page.

Do not restart the WebGL scene.

Do not cause a visible flash.

Do not reset the DOM.

The transition should be seamless.

Use a deterministic normalized timeline:

```javascript
progress = (elapsedTime % ONE_HOUR) / ONE_HOUR;
```

The entire environment should derive its state from this timeline wherever practical.

This allows the animation to remain deterministic and synchronized.

---

# 17. PERFORMANCE IS CRITICAL

This is still a portfolio website.

The animation must NOT destroy performance.

Target:

**60 FPS on a modern desktop**

Gracefully degrade on weaker devices.

Implement:

- GPU acceleration
- instancing
- object pooling
- LOD
- frustum culling
- texture compression where appropriate
- lazy loading
- efficient shaders
- reduced particle counts on mobile
- reduced resolution on mobile
- pause/slow animation when the tab is hidden

Do NOT load massive uncompressed textures.

Do NOT introduce hundreds of megabytes of assets.

---

# 18. MOBILE

On mobile devices:

Do NOT attempt to render the exact desktop scene.

Instead create a simplified version.

For example:

Desktop:
- Full 3D environment
- Many stars
- planets
- asteroids
- nebulae
- detailed parallax

Mobile:
- reduced star count
- fewer objects
- simplified shaders
- fewer particles
- lower texture resolution

The portfolio UI must remain responsive and readable.

---

# 19. REDUCED MOTION

Respect:

```text
prefers-reduced-motion
```

If the user has reduced motion enabled:

- Disable major camera movement
- Disable fast-moving objects
- Keep planets rotating extremely slowly or freeze them
- Keep a subtle static cosmic background

Accessibility takes priority over cinematic effects.

---

# 20. AUDIO

Do NOT automatically add audio.

Do not autoplay music.

If the existing website already has an audio system, integrate only if appropriate.

The visual experience should work perfectly without sound.

---

# 21. DO NOT BREAK THE EXISTING WEBSITE

Before implementation:

1. Inspect the current application architecture.
2. Identify the existing background implementation.
3. Identify the main UI containers.
4. Identify existing animation libraries.
5. Identify whether Three.js/WebGL is already used.
6. Reuse existing dependencies wherever practical.
7. Avoid unnecessary dependencies.

Do NOT rewrite unrelated components.

Do NOT change:

- Portfolio content
- Project information
- Navigation
- Typography
- Existing interactive components
- Resume/contact functionality

unless absolutely necessary for integration.

---

# 22. IMPLEMENTATION ARCHITECTURE

Prefer a clean separation such as:

```text
SpaceScene
 ├── Camera
 ├── StarField
 ├── PlanetSystem
 ├── CelestialObjects
 ├── NebulaSystem
 ├── AsteroidField
 ├── SpaceLighting
 ├── SpaceWindow
 ├── JourneyTimeline
 └── CinematicEvents
```

The exact architecture should follow the existing project.

Create a centralized journey controller:

```text
JourneyTimeline
```

which exposes something conceptually similar to:

```javascript
journey.progress
journey.elapsed
journey.currentSection
journey.loopCount
```

Every visual system should use the same timeline.

---

# 23. IMPORTANT: MAKE IT LOOK PREMIUM

Do NOT make this look like a demo of Three.js.

Avoid:

- cartoon planets
- low-resolution textures
- obvious procedural spheres
- excessive bloom
- excessive lens flare
- neon sci-fi clichés
- cheap particle effects
- overly bright stars
- random objects everywhere

The visual target should be:

**cinematic + sophisticated + realistic + futuristic + restrained**

Think:

> AAA sci-fi film  
> NASA visualization  
> futuristic spacecraft observation window  
> premium AI product interface

rather than:

> browser game

---

# 24. VISUAL HIERARCHY

The hierarchy must always be:

1. Portfolio content
2. Portfolio navigation/interactions
3. Space environment
4. Cinematic details

The background must support the website rather than compete with it.

When text is over a bright planet or star field, automatically ensure sufficient contrast.

If necessary, use:

- subtle dark overlays
- dynamic vignette
- local background dimming
- blur
- gradient overlays

---

# 25. OPTIONAL HUD DETAILS

If they fit the existing design, add extremely subtle spaceship instrumentation.

For example:

```text
SECTOR 07
DEEP SPACE
VELOCITY 0.42C
MISSION TIME 27:43
```

But these must be subtle.

Do NOT turn the website into a game HUD.

The existing portfolio UI remains the primary interface.

---

# 26. FINAL USER EXPERIENCE

When someone opens the website, they should immediately feel:

> "I'm inside a futuristic spacecraft."

After staying on the website for several minutes:

> "This environment is actually moving through space."

After 10–20 minutes:

> "The scenery is changing."

After 30–60 minutes:

> "This is a continuous journey through an entire cosmic route."

And after one hour:

> "The journey seamlessly started again."

The effect should make the portfolio memorable without making it difficult to use.

---

# 27. IMPLEMENTATION PROCESS

Follow this workflow:

### Step 1
Inspect the entire existing codebase.

### Step 2
Understand the existing design system.

### Step 3
Identify the current background implementation.

### Step 4
Design the space rendering architecture.

### Step 5
Implement the core 3D space environment.

### Step 6
Implement the deterministic 60-minute journey timeline.

### Step 7
Add planets and continuous planetary rotation.

### Step 8
Add stars, known stars, nebulae and deep-space objects.

### Step 9
Add Sun encounter.

### Step 10
Add asteroid field.

### Step 11
Add cinematic camera movement.

### Step 12
Add spaceship-window visual treatment.

### Step 13
Implement seamless 60-minute looping.

### Step 14
Optimize desktop performance.

### Step 15
Implement mobile degradation.

### Step 16
Implement reduced-motion accessibility.

### Step 17
Test the website at different timeline positions.

### Step 18
Verify that the existing portfolio functionality remains intact.

---

# 28. TESTING REQUIREMENTS

Do not only test the beginning.

Create a temporary development/debug mechanism allowing the journey to be jumped to:

```text
0%
10%
20%
30%
40%
50%
60%
70%
80%
90%
99%
```

Use this to verify every section.

Remove or disable the debug controls from production.

Verify:

- No visual glitches
- No memory leaks
- No major FPS drops
- No texture pop-in where avoidable
- No sudden camera jumps
- No visible loop seam
- No broken UI
- No text readability issues

---

# 29. MOST IMPORTANT DESIGN PRINCIPLE

The final result should NOT look like:

> "A portfolio website with a space animation."

It should look like:

> **"A futuristic spacecraft interface that happens to contain Raj's portfolio."**

That distinction is extremely important.

The space environment should feel like the **world surrounding the website**, not a decorative background added afterward.

Implement this directly into the existing project while preserving its current identity and functionality.