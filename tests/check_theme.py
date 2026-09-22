import re

css = open('assets/css/styles.css').read()
print('brace balance:', css.count('{') - css.count('}'))

defined = set(re.findall(r'--([a-z0-9-]+)\s*:', css))
used = set(re.findall(r'var\(--([a-z0-9-]+)', css))
print('undefined tokens used:', sorted(used - defined))
print('unused tokens:', sorted(defined - used))

root_block = css[css.index(':root'):css.index('[data-theme="light"]')]
light_block = css[css.index('[data-theme="light"]'):css.index('/* Reset & Base */')]
r = set(re.findall(r'--([a-z0-9-]+)\s*:', root_block))
l = set(re.findall(r'--([a-z0-9-]+)\s*:', light_block))
print('root tokens without light override:', sorted(r - l))

light_rules = re.findall(r'\[data-theme="light"\][^{]*\{[^}]*\}', css)
print('light-specific rules:', len(light_rules))
for rule in light_rules:
    print('  -', rule.split('{')[0].strip().replace('\n', ' '))
