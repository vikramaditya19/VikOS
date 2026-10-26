import { useLayoutEffect, useRef, useState } from 'react'
import { sound } from '../../utils/sound'

/* ------------------------------------------------------------------ */
/* Identity and virtual filesystem (lives only in memory)              */
/* ------------------------------------------------------------------ */

const USER = 'vikramaditya'
const HOST = 'vikOS'
const HOME = '/home/vikramaditya'
const START_DIR = `${HOME}/vikOS/secure_vault`
const MAX_LINES = 500

const dir = (children) => ({ type: 'dir', children })
const file = (content) => ({ type: 'file', content })

const FS = dir({
  home: dir({
    vikramaditya: dir({
      Documents: dir({
        'todo.txt': file(
          ['[x] Forge the obsidian theme', '[x] Teach the desktop to hum', '[ ] Build the File Explorer', '[ ] Build Settings'].join('\n'),
        ),
      }),
      vikOS: dir({
        'README.md': file(
          ['# vikOS', '', 'A browser-based desktop in obsidian and crimson.', 'Everything in this shell is simulated and sandboxed.'].join('\n'),
        ),
        apps: dir({
          'manifest.json': file(
            ['{', '  "apps": ["files", "terminal", "browser", "notes",', '           "calculator", "gallery", "music", "monitor", "settings"]', '}'].join('\n'),
          ),
        }),
        secure_vault: dir({
          'vaultline_core.config': file(
            [
              '# vaultline core configuration',
              '[vault]',
              'name        = secure_vault',
              'owner       = vikramaditya',
              'encryption  = simulated',
              'auto_lock   = 300',
              '',
              '[telemetry]',
              'enabled     = true',
              'log_file    = system_telemetry.log',
              'interval_ms = 1000',
              '',
              '[theme]',
              'palette     = obsidian-crimson',
              'motif       = cloud',
            ].join('\n'),
          ),
          'system_telemetry.log': file(
            [
              '[2026-10-26 09:00:01] INFO  kernel      vikOS 1.0 boot sequence complete',
              '[2026-10-26 09:00:02] INFO  vaultline   core service started on port 7421 (sandboxed)',
              '[2026-10-26 09:00:04] INFO  render      wallpaper layers composited: 8',
              '[2026-10-26 09:00:09] WARN  audio       AudioContext suspended, waiting for user gesture',
              '[2026-10-26 09:01:15] INFO  audio       synthesizer online',
              '[2026-10-26 09:12:48] INFO  windows     window manager idle',
            ].join('\n'),
          ),
          'README.txt': file(
            ['secure_vault', '------------', 'Try:  cat vaultline_core.config', '      cat system_telemetry.log', '      ls -la'].join('\n'),
          ),
          '.vaultkey': file('(hidden) the key is not stored here.'),
        }),
      }),
    }),
  }),
})

/* ------------------------------------------------------------------ */
/* Path helpers                                                        */
/* ------------------------------------------------------------------ */

function resolvePath(input, cwd) {
  let p = input
  if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1)
  if (!p.startsWith('/')) p = `${cwd}/${p}`
  const out = []
  for (const part of p.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return '/' + out.join('/')
}

function getNode(abs) {
  let node = FS
  for (const part of abs.split('/').filter(Boolean)) {
    if (node.type !== 'dir' || !Object.prototype.hasOwnProperty.call(node.children, part)) return null
    node = node.children[part]
  }
  return node
}

function prettyPath(abs) {
  if (abs === HOME) return '~'
  if (abs.startsWith(HOME + '/')) return '~' + abs.slice(HOME.length)
  return abs
}

function formatSize(node) {
  if (node.type === 'dir') return '4.0K'
  const n = node.content.length
  return n < 1024 ? `${n}B` : `${(n / 1024).toFixed(1)}K`
}

function commonPrefix(words) {
  let prefix = words[0]
  for (const w of words) {
    while (!w.startsWith(prefix)) prefix = prefix.slice(0, -1)
  }
  return prefix
}

/* ------------------------------------------------------------------ */
/* Command parsing and execution                                       */
/* ------------------------------------------------------------------ */

const COMMANDS = {
  help: 'List all available commands',
  ls: 'List directory contents  (-a hidden, -l long)',
  cd: 'Change directory',
  pwd: 'Print working directory',
  whoami: 'Show the current user',
  cat: 'Print the contents of a file',
  clear: 'Clear the terminal',
  date: 'Show the current date and time',
  echo: 'Print text back to the terminal',
  history: 'Show commands you have run',
}
const COMMAND_NAMES = Object.keys(COMMANDS)

const t = (text, tone) => ({ segments: [{ text, tone }] })
const ok = (lines = [], extra = {}) => ({ lines, error: false, ...extra })
const fail = (message) => ({ lines: [t(message, 'err')], error: true })

function tokenize(input) {
  const tokens = []
  let current = ''
  let quote = null
  let started = false
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      started = true
    } else if (/\s/.test(ch)) {
      if (current || started) {
        tokens.push(current)
        current = ''
        started = false
      }
    } else {
      current += ch
    }
  }
  if (current || started) tokens.push(current)
  return tokens
}

function execute(raw, cwd, history) {
  const [cmd, ...args] = tokenize(raw)
  if (!cmd) return ok()

  switch (cmd) {
    case 'help': {
      const lines = [t('vikOS shell: available commands', 'dim')]
      for (const name of COMMAND_NAMES) {
        lines.push({
          segments: [
            { text: '  ' + name.padEnd(9), tone: 'accent' },
            { text: COMMANDS[name], tone: 'dim' },
          ],
        })
      }
      lines.push(t('Tab completes  ·  ↑ ↓ history  ·  Ctrl+L clears', 'dim'))
      return ok(lines)
    }

    case 'pwd':
      return ok([t(cwd, 'file')])

    case 'whoami':
      return ok([t(`${USER}@${HOST}`, 'file')])

    case 'date':
      return ok([t(new Date().toString(), 'file')])

    case 'clear':
      return ok([], { clear: true })

    case 'echo': {
      const vars = { USER, HOST, HOME, PWD: cwd }
      const text = args.join(' ').replace(/\$(USER|HOST|HOME|PWD)\b/g, (_, name) => vars[name])
      return ok([t(text, 'file')])
    }

    case 'history':
      return ok(history.map((h, i) => t(`${String(i + 1).padStart(4)}  ${h}`, 'plain')))

    case 'cd': {
      const target = args[0] ?? '~'
      const abs = resolvePath(target, cwd)
      const node = getNode(abs)
      if (!node) return fail(`cd: no such file or directory: ${target}`)
      if (node.type !== 'dir') return fail(`cd: not a directory: ${target}`)
      return ok([], { cwd: abs })
    }

    case 'cat': {
      if (args.length === 0) return fail('cat: missing file operand')
      const lines = []
      let hadError = false
      for (const arg of args) {
        const node = getNode(resolvePath(arg, cwd))
        if (!node) {
          lines.push(t(`cat: ${arg}: No such file or directory`, 'err'))
          hadError = true
        } else if (node.type === 'dir') {
          lines.push(t(`cat: ${arg}: Is a directory`, 'err'))
          hadError = true
        } else {
          node.content.split('\n').forEach((line) => lines.push(t(line, 'file')))
        }
      }
      return { lines, error: hadError }
    }

    case 'ls': {
      const flags = args.filter((a) => a.startsWith('-') && a.length > 1)
      const paths = args.filter((a) => !(a.startsWith('-') && a.length > 1))
      const showAll = flags.some((f) => f.includes('a'))
      const long = flags.some((f) => f.includes('l'))
      const target = paths[0] ?? '.'
      const node = getNode(resolvePath(target, cwd))

      if (!node) return fail(`ls: cannot access '${target}': No such file or directory`)
      if (node.type === 'file') return ok([t(target, 'file')])

      const names = Object.keys(node.children)
        .filter((n) => showAll || !n.startsWith('.'))
        .sort((a, b) => {
          const aDir = node.children[a].type === 'dir'
          const bDir = node.children[b].type === 'dir'
          if (aDir !== bDir) return aDir ? -1 : 1
          return a.localeCompare(b)
        })

      if (names.length === 0) return ok()

      if (long) {
        return ok(
          names.map((name) => {
            const child = node.children[name]
            const isDir = child.type === 'dir'
            return {
              segments: [
                { text: `${isDir ? 'drwxr-xr-x' : '-rw-r--r--'}  ${USER}  ${formatSize(child).padStart(5)}  Oct 26  `, tone: 'dim' },
                { text: name + (isDir ? '/' : ''), tone: isDir ? 'dir' : 'file' },
              ],
            }
          }),
        )
      }

      const segments = []
      names.forEach((name) => {
        const isDir = node.children[name].type === 'dir'
        segments.push({ text: name + (isDir ? '/' : ''), tone: isDir ? 'dir' : 'file' })
        segments.push({ text: '   ', tone: 'plain' })
      })
      return ok([{ segments }])
    }

    default:
      return fail(`zsh: command not found: ${cmd}`)
  }
}

/* ------------------------------------------------------------------ */
/* Rendering helpers                                                   */
/* ------------------------------------------------------------------ */

const TONES = {
  plain: 'text-bone-dim',
  file: 'text-bone',
  dir: 'text-crimson-300',
  accent: 'text-crimson-300',
  dim: 'text-ash',
  err: 'text-crimson-400',
}

let nextId = 0
const withId = (line) => ({ ...line, id: ++nextId })

const makeBanner = () =>
  [
    { kind: 'out', ...t('vikOS Terminal 1.0  ·  sandboxed shell', 'accent') },
    { kind: 'out', ...t('Nothing here touches your real computer. Type "help" to begin.', 'dim') },
    { kind: 'out', ...t('', 'dim') },
  ].map(withId)

function Prompt({ cwd }) {
  return (
    <span className="whitespace-nowrap">
      <span className="text-crimson-400">{USER}</span>
      <span className="text-mist">@</span>
      <span className="text-bone-dim">{HOST}</span>
      <span> </span>
      <span className="text-crimson-300">{prettyPath(cwd)}</span>
      <span> </span>
      <span className="text-crimson-500">❯</span>
      <span> </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function TerminalApp() {
  const [lines, setLines] = useState(makeBanner)
  const [cwd, setCwd] = useState(START_DIR)
  const [input, setInput] = useState('')

  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const historyRef = useRef([])
  const historyIndex = useRef(null) // null = not browsing history
  const draftRef = useRef('')
  const lastKeySound = useRef(0)

  // Auto-scroll to the bottom whenever output or the input line changes
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, input])

  const append = (newLines) => setLines((prev) => [...prev, ...newLines.map(withId)].slice(-MAX_LINES))

  const promptLine = (text) => ({ kind: 'cmd', cwd, text })

  const focusInput = () => {
    // Don't steal focus while the user is selecting text to copy
    if (window.getSelection()?.toString()) return
    inputRef.current?.focus()
  }

  const submit = () => {
    const raw = input.trim()
    setInput('')
    historyIndex.current = null
    draftRef.current = ''

    if (!raw) {
      append([promptLine('')])
      sound.click()
      return
    }

    const hist = historyRef.current
    if (hist[hist.length - 1] !== raw) hist.push(raw)

    const result = execute(raw, cwd, hist)

    if (result.clear) {
      setLines([])
    } else {
      append([promptLine(raw), ...result.lines.map((l) => ({ kind: 'out', ...l }))])
    }
    if (result.cwd) setCwd(result.cwd)

    if (result.error) sound.error()
    else sound.click()
  }

  const complete = () => {
    const cut = input.lastIndexOf(' ')
    const head = input.slice(0, cut + 1)
    const word = input.slice(cut + 1)
    const isFirstWord = head.trim() === ''

    let candidates = [] // [{ text, isDir }]
    if (isFirstWord) {
      candidates = COMMAND_NAMES.filter((n) => n.startsWith(word)).map((n) => ({ text: n, isDir: false }))
    } else {
      const slash = word.lastIndexOf('/')
      const dirPart = word.slice(0, slash + 1)
      const namePart = word.slice(slash + 1)
      const node = getNode(resolvePath(dirPart || '.', cwd))
      if (node && node.type === 'dir') {
        candidates = Object.keys(node.children)
          .filter((n) => n.startsWith(namePart) && (namePart.startsWith('.') || !n.startsWith('.')))
          .sort()
          .map((n) => ({ text: dirPart + n, isDir: node.children[n].type === 'dir' }))
      }
    }

    if (candidates.length === 0) return

    if (candidates.length === 1) {
      const [only] = candidates
      const suffix = only.isDir ? '/' : isFirstWord ? ' ' : ''
      setInput(head + only.text + suffix)
      return
    }

    const prefix = commonPrefix(candidates.map((c) => c.text))
    if (prefix.length > word.length) {
      setInput(head + prefix)
    } else {
      append([
        promptLine(input),
        {
          kind: 'out',
          segments: candidates.map((c) => ({
            text: c.text.split('/').filter(Boolean).pop() + (c.isDir ? '/   ' : '   '),
            tone: c.isDir ? 'dir' : 'file',
          })),
        },
      ])
    }
  }

  const browseHistory = (direction) => {
    const hist = historyRef.current
    if (hist.length === 0) return

    if (direction === 'up') {
      if (historyIndex.current === null) {
        draftRef.current = input
        historyIndex.current = hist.length - 1
      } else {
        historyIndex.current = Math.max(0, historyIndex.current - 1)
      }
      setInput(hist[historyIndex.current])
    } else {
      if (historyIndex.current === null) return
      if (historyIndex.current >= hist.length - 1) {
        historyIndex.current = null
        setInput(draftRef.current)
      } else {
        historyIndex.current += 1
        setInput(hist[historyIndex.current])
      }
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      complete()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      browseHistory('up')
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      browseHistory('down')
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLines([])
      sound.click()
      return
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      // Keep normal copy working when text is highlighted in the input
      if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd) return
      e.preventDefault()
      append([promptLine(input + '^C')])
      setInput('')
      historyIndex.current = null
      sound.hover()
      return
    }

    // Typing / deleting: quiet blip, throttled for held keys
    if (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key.length === 1 || e.key === 'Backspace')) {
      const now = performance.now()
      if (now - lastKeySound.current > 30) {
        lastKeySound.current = now
        sound.hover()
      }
    }
  }

  return (
    <div
      onClick={focusInput}
      className="flex h-full min-h-0 w-full cursor-text flex-col bg-obsidian-950/80 font-mono text-[13px] leading-[1.45]"
    >
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
        className="min-h-0 flex-1 overflow-y-auto p-3"
        style={{ userSelect: 'text' }}
      >
        {lines.map((line) =>
          line.kind === 'cmd' ? (
            <div key={line.id} className="whitespace-pre-wrap break-words">
              <Prompt cwd={line.cwd} />
              <span className="text-bone">{line.text}</span>
            </div>
          ) : (
            <div key={line.id} className="min-h-[1.45em] whitespace-pre-wrap break-words">
              {line.segments.map((seg, i) => (
                <span key={i} className={TONES[seg.tone] ?? TONES.plain}>
                  {seg.text}
                </span>
              ))}
            </div>
          ),
        )}

        {/* Live input line */}
        <div className="flex items-center">
          <Prompt cwd={cwd} />
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              historyIndex.current = null
            }}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Terminal input"
            className="min-w-0 flex-1 bg-transparent text-bone caret-crimson-500 outline-none"
            style={{ userSelect: 'text' }}
          />
        </div>
      </div>
    </div>
  )
}