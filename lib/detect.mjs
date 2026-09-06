// Project detection for /harness:init. Detect, do not ask first.
import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

export function detectProject(root) {
  const has = (f) => existsSync(join(root, f))
  const readJson = (f) => {
    try {
      return JSON.parse(readFileSync(join(root, f), 'utf8'))
    } catch {
      return null
    }
  }

  const out = {
    project: basename(root),
    description: '',
    stack: 'unknown',
    package_manager: '',
    commands: { install: '', verify: '', start: '', format: '', test: '' },
    requires: {},
    notes: [],
  }

  const pkg = readJson('package.json')
  if (pkg) {
    out.stack = 'node'
    out.project = (pkg.name ?? out.project).replace(/^@[^/]+\//, '')
    out.description = pkg.description ?? ''
    const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lockb') || has('bun.lock') ? 'bun' : 'npm'
    out.package_manager = pm
    const run = (s) => (pm === 'npm' ? `npm run ${s}` : `${pm} ${s}`)
    const scripts = pkg.scripts ?? {}
    out.commands.install =
      pm === 'pnpm' ? 'pnpm install --frozen-lockfile' : pm === 'yarn' ? 'yarn install --frozen-lockfile' : pm === 'bun' ? 'bun install --frozen-lockfile' : 'npm ci'
    if (scripts.verify) out.commands.verify = run('verify')
    else {
      const parts = ['typecheck', 'test', 'lint'].filter((s) => scripts[s]).map(run)
      if (scripts.check && !parts.length) parts.push(run('check'))
      out.commands.verify = parts.join(' && ')
      if (!parts.length) out.notes.push('package.json has no verify/typecheck/test/lint script; add one, a harness needs a verification path')
    }
    if (scripts.test) out.commands.test = run('test')
    out.commands.start = scripts.dev ? run('dev') : scripts.start ? run('start') : ''
    const dev = { ...(pkg.devDependencies ?? {}), ...(pkg.dependencies ?? {}) }
    if (dev['@biomejs/biome'] || has('biome.json') || has('biome.jsonc')) out.commands.format = `${pm === 'npm' ? 'npx' : `${pm} exec`} biome check --write {file}`
    else if (dev.prettier || has('.prettierrc') || has('prettier.config.js') || has('prettier.config.mjs')) out.commands.format = `${pm === 'npm' ? 'npx' : `${pm} exec`} prettier --write {file}`
    const nodeReq = pkg.engines?.node ?? (has('.node-version') ? `>=${readFileSync(join(root, '.node-version'), 'utf8').trim().replace(/^v/, '')}` : '')
    if (nodeReq) out.requires.node = normalizeRange(nodeReq)
    if (pm !== 'npm') {
      const pmv = String(pkg.packageManager ?? '').match(new RegExp(`${pm}@(\\d+)`))
      out.requires[pm] = pmv ? `>=${pmv[1]}` : '>=1'
    }
    return out
  }

  if (has('pyproject.toml') || has('requirements.txt') || has('setup.py')) {
    out.stack = 'python'
    const uv = has('uv.lock')
    out.package_manager = uv ? 'uv' : has('poetry.lock') ? 'poetry' : 'pip'
    out.commands.install = uv ? 'uv sync' : out.package_manager === 'poetry' ? 'poetry install' : 'pip install -r requirements.txt'
    const prefix = uv ? 'uv run ' : out.package_manager === 'poetry' ? 'poetry run ' : ''
    out.commands.test = `${prefix}pytest`
    out.commands.verify = has('pyproject.toml') && readFileSync(join(root, 'pyproject.toml'), 'utf8').includes('ruff') ? `${prefix}ruff check . && ${prefix}pytest` : `${prefix}pytest`
    if (has('ruff.toml') || out.commands.verify.includes('ruff')) out.commands.format = `${prefix}ruff format {file}`
    out.requires.python = '>=3.11'
    return out
  }

  if (has('Cargo.toml')) {
    out.stack = 'rust'
    out.package_manager = 'cargo'
    out.commands.install = 'cargo fetch'
    out.commands.verify = 'cargo fmt --check && cargo clippy -- -D warnings && cargo test'
    out.commands.test = 'cargo test'
    out.commands.format = 'rustfmt {file}'
    out.requires.cargo = '>=1'
    return out
  }

  if (has('go.mod')) {
    out.stack = 'go'
    out.package_manager = 'go'
    out.commands.install = 'go mod download'
    out.commands.verify = 'go vet ./... && go test ./...'
    out.commands.test = 'go test ./...'
    out.commands.format = 'gofmt -w {file}'
    out.requires.go = '>=1'
    return out
  }

  out.notes.push('no package manifest recognised (node/python/rust/go); fill harness.json commands by hand')
  return out
}

function normalizeRange(r) {
  const m = String(r).match(/(>=|\^|~)?\s*v?(\d+(?:\.\d+){0,2})/)
  return m ? `${m[1] ?? '>='}${m[2]}` : '>=1'
}
