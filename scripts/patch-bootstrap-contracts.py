from pathlib import Path

path = Path("scripts/bootstrap-monorepo.sh")
text = path.read_text()

text = text.replace("PANEL_SHA=\"f8ef396c0dca73e89618fa79922b1633577ecb90\"", "PANEL_SHA=\"03ac11773d9bc2c2d541dbdda8cf33d0db6bad76\"")
text = text.replace("'workspace:*'", "'*'")

old = """const source = new URL('../apps/server/src/management/interface/dto/', import.meta.url);\nconst target = new URL('../packages/contracts/src/', import.meta.url);\n\nawait rm(target, { recursive: true, force: true });\nawait mkdir(target, { recursive: true });\n\nconst entries = (await readdir(source, { withFileTypes: true }))\n  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))\n  .sort((a, b) => a.name.localeCompare(b.name));\n\nfor (const entry of entries) {\n  await cp(new URL(entry.name, source), new URL(entry.name, target));\n}\n\nconsole.log(`Synced ${entries.length} management contract files into ${basename(target.pathname) || 'contracts'}.`);\n"""

new = """const source = new URL('../apps/server/src/management/interface/dto/', import.meta.url);\nconst packageRoot = new URL('../packages/contracts/src/', import.meta.url);\nconst target = new URL('../packages/contracts/src/management/interface/dto/', import.meta.url);\nconst domainSource = new URL('../apps/server/src/conversation-engine/domain/', import.meta.url);\nconst domainTarget = new URL('../packages/contracts/src/conversation-engine/domain/', import.meta.url);\n\nawait rm(packageRoot, { recursive: true, force: true });\nawait mkdir(target, { recursive: true });\nawait mkdir(domainTarget, { recursive: true });\n\nconst entries = (await readdir(source, { withFileTypes: true }))\n  .filter((entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts'))\n  .sort((a, b) => a.name.localeCompare(b.name));\n\nfor (const entry of entries) {\n  await cp(new URL(entry.name, source), new URL(entry.name, target));\n}\n\nconst domainFiles = ['lead-intent.ts', 'lead-qualification.ts', 'product-catalog.ts'];\nfor (const name of domainFiles) {\n  await cp(new URL(name, domainSource), new URL(name, domainTarget));\n}\n\nconsole.log(`Synced ${entries.length} management contract files and ${domainFiles.length} shared domain files.`);\n"""

if old not in text:
    raise SystemExit("Could not find sync-contracts block to patch")
text = text.replace(old, new)

text = text.replace('"main": "./src/index.ts"', '"main": "./src/management/interface/dto/index.ts"')
text = text.replace('"types": "./src/index.ts"', '"types": "./src/management/interface/dto/index.ts"')
text = text.replace('".": "./src/index.ts"', '".": "./src/management/interface/dto/index.ts"')

path.write_text(text)
