import re, pathlib, collections

root = pathlib.Path(".")
css_text = (root / "decor.css").read_text(encoding="utf-8")
css_clean = re.sub(r"/\*.*?\*/", "", css_text, flags=re.S)

defined = sorted(set(re.findall(r"\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)", css_clean)))

html_files = sorted(root.glob("*.html"))
js_files = sorted(root.glob("*.js"))

tokens = set()
for f in html_files + js_files:
    t = f.read_text(encoding="utf-8", errors="ignore")
    for m in re.finditer(r'class="([^"]*)"', t):
        for c in m.group(1).split():
            tokens.add(c)
    for m in re.finditer(r"classList\.(?:add|remove|toggle|contains)\(\s*['\"]([^'\"]+)['\"]", t):
        for c in m.group(1).split():
            tokens.add(c)
    for m in re.finditer(r"className\s*=\s*['\"]([^'\"]+)['\"]", t):
        for c in re.split(r"[\s\$]+", m.group(1)):
            if c:
                tokens.add(c)
    for m in re.finditer(r'classList\.\w+\(\s*`([^`]+)`', t):
        for c in m.group(1).split():
            tokens.add(c)

body_all = " ".join(f.read_text(encoding="utf-8", errors="ignore") for f in html_files + js_files)

dead = [d for d in defined
        if d not in ("js", "reveal-failsafe")
        and not re.search(r"(?<![\w-])" + re.escape(d) + r"(?![\w-])", body_all)]

# page css coverage
page_css = {}
for p in root.glob("*.css"):
    if p.name == "decor.css":
        continue
    c = re.sub(r"/\*.*?\*/", "", p.read_text(encoding="utf-8"), flags=re.S)
    for cls in set(re.findall(r"\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)", c)):
        page_css.setdefault(cls, []).append(p.name)

print("=" * 78)
print("DEFINED IN decor.css BUT NEVER USED  (%d)" % len(dead))
print("=" * 78)
for d in dead:
    other = page_css.get(d)
    print("  %-30s %s" % (d, ("also in " + ",".join(other)) if other else ""))

print()
print("=" * 78)
print("USED IN MARKUP, NOT DEFINED IN decor.css")
print("=" * 78)
for t in sorted(tokens):
    if not re.fullmatch(r"[_a-zA-Z][-_a-zA-Z0-9]*", t):
        continue
    if t in ("js", "reveal-failsafe"):
        continue
    if t not in defined:
        other = page_css.get(t)
        loc = ("defined in " + ",".join(other)) if other else ">>> DEFINED NOWHERE <<<"
        print("  %-30s %s" % (t, loc))

print()
print("=" * 78)
print("DUPLICATE RULE PRELUDES INSIDE decor.css")
print("=" * 78)
preludes = [re.sub(r"\s+", " ", m.group(1)).strip()
            for m in re.finditer(r"([^{}@;]+)\{", css_clean)]
preludes = [p for p in preludes if p and not p.startswith("@")]
for i, name in enumerate(preludes):
    if "keyframes" in name:
        continue
for k, v in collections.Counter(preludes).items():
    if v > 1:
        print("  %dx  %s" % (v, k))

print()
print("=" * 78)
print("OVERLAP: page css re-declares a decor.css selector")
print("=" * 78)
for p in sorted(root.glob("*.css")):
    if p.name == "decor.css":
        continue
    c = re.sub(r"/\*.*?\*/", "", p.read_text(encoding="utf-8"), flags=re.S)
    overlapped = sorted(set(re.findall(r"\.(-?[_a-zA-Z][_a-zA-Z0-9-]*)", c)) & set(defined))
    print("\n  --- %s  (%d overlaps) ---" % (p.name, len(overlapped)))
    print("   " + ", ".join(overlapped))

print()
print("=" * 78)
print("HARD-CODED COLORS IN decor.css")
print("=" * 78)
cols = collections.Counter(re.findall(r"#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)", css_clean))
for c, n in cols.most_common(40):
    print("  %-42s x%d" % (c, n))
print("  TOTAL distinct colour literals:", len(cols), " occurrences:", sum(cols.values()))
