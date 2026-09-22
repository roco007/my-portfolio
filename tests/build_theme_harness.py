"""
Temporary visual verification harness for the dark / light theme work.

Generates standalone copies of index.html that force a specific theme
(so a headless screenshot can be taken deterministically) plus a variant
that programmatically clicks the toggle to prove the end-to-end behaviour.
"""

import os
import re
import shutil

SRC = '/Users/raj.colaco/Desktop/PersonalGit/my-portfolio'
OUT = '/tmp/theme-check'

shutil.rmtree(OUT, ignore_errors=True)
os.makedirs(OUT, exist_ok=True)
os.symlink(os.path.join(SRC, 'assets'), os.path.join(OUT, 'assets'))

html = open(os.path.join(SRC, 'index.html')).read()

bootstrap_re = re.compile(r'<script>\s*/\* Theme bootstrap.*?</script>', re.S)
assert bootstrap_re.search(html), 'bootstrap script not found'

report_script = """
    <div id="theme-report" style="position:fixed;left:8px;bottom:8px;z-index:9999;
        font:600 13px monospace;background:#000;color:#0f0;padding:6px 10px;border-radius:4px;"></div>
    <script>
        window.addEventListener('load', function () {
            setTimeout(function () {
                document.getElementById('theme-toggle').click();
                setTimeout(function () {
                    var root = document.documentElement;
                    document.getElementById('theme-report').textContent =
                        'data-theme=' + root.getAttribute('data-theme') +
                        ' | aria-pressed=' + document.getElementById('theme-toggle').getAttribute('aria-pressed') +
                        ' | stored=' + localStorage.getItem('portfolio-theme') +
                        ' | theme-color=' + document.getElementById('theme-color-meta').getAttribute('content');
                }, 300);
            }, 400);
        });
    </script>
</body>"""

for theme in ('dark', 'light'):
    forced = bootstrap_re.sub(
        "<script>document.documentElement.setAttribute('data-theme', '%s');</script>" % theme,
        html,
    )
    # freeze entrance animations so the screenshot is deterministic
    forced = forced.replace('.fade-in', '.fade-in')
    open(os.path.join(OUT, theme + '.html'), 'w').write(forced)

toggled = bootstrap_re.sub(
    "<script>document.documentElement.setAttribute('data-theme', 'dark');</script>",
    html,
).replace('</body>', report_script)
open(os.path.join(OUT, 'toggle.html'), 'w').write(toggled)

# Region variants so the projects grid / contact panel can be inspected per theme.
# Content is shifted upwards inline instead of scrolling (headless screenshots
# of scrolled pages are unreliable), and the fixed nav is hidden in these shots.
shift_tpl = '<style>header{display:none;}main{position:relative;top:-%dpx;}</style></head>'

for theme in ('dark', 'light'):
    base = open(os.path.join(OUT, theme + '.html')).read()
    # force the scroll-reveal state so screenshots are deterministic (harness only)
    base = base.replace(
        '</head>',
        '<style>.fade-in{opacity:1!important;transform:none!important;}</style></head>'
    )
    for name, offset in (('projects', 1450), ('grid', 2450), ('contact', 3750)):
        open(os.path.join(OUT, '%s-%s.html' % (name, theme)), 'w').write(
            base.replace('</head>', shift_tpl % offset)
        )

# Hover-state variant: forces the card image overlay + live button open so the
# inverted button colours can be inspected per theme.
hover_css = (
    '<style>.fade-in{opacity:1!important;transform:none!important;}'
    'header{display:none;}main{position:relative;top:-2450px;}'
    '.card-overlay{opacity:1!important;}'
    '.card-overlay .live-btn{transform:none!important;}'
    '.cyber-laser-scan{display:none!important;}</style></head>'
)

for theme in ('dark', 'light'):
    base = open(os.path.join(OUT, theme + '.html')).read()
    open(os.path.join(OUT, 'hover-%s.html' % theme), 'w').write(
        base.replace('</head>', hover_css)
    )

print('harness written to', OUT)
print(sorted(os.listdir(OUT)))
