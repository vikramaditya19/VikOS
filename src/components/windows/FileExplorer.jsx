import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  ArrowUp,
  ChevronRight,
  Eye,
  EyeOff,
  File as FileIcon,
  FileText,
  Folder,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { sound } from '../../utils/sound'
import { CryptoError, decryptText, encryptText, isCryptoAvailable } from '../../utils/crypto'

/* ------------------------------------------------------------------ */
/* In-memory vault. Lives at module level so locked files stay locked   */
/* after the window closes (until the page reloads).                    */
/* ------------------------------------------------------------------ */

const dir = (children) => ({ type: 'dir', children })
const file = (content, sensitive = false) => ({ type: 'file', content, payload: null, sensitive })

const ROOT = dir({
  Documents: dir({
    'todo.txt': file(
      ['[x] Forge the obsidian theme', '[x] Teach the desktop to hum', '[x] Build the Terminal', '[ ] Share one filesystem'].join('\n'),
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
          'encryption  = aes-gcm-256',
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
        true,
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
        true,
      ),
      'README.txt': file(
        ['secure_vault', '------------', 'Select a file, then use the Security panel to lock it with a passphrase.'].join('\n'),
      ),
      '.vaultkey': file('(hidden) the key is not stored here.', true),
    }),
  }),
})

let version = 0
const listeners = new Set()
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const getVersion = () => version
const bump = () => {
  version += 1
  listeners.forEach((fn) => fn())
}

function getNode(path) {
  let node = ROOT
  for (const part of path) {
    if (node.type !== 'dir' || !Object.prototype.hasOwnProperty.call(node.children, part)) return null
    node = node.children[part]
  }
  return node
}

function setEncrypted(node, payload) {
  node.payload = payload
  node.content = null
  bump()
}

function setPlain(node, text) {
  node.content = text
  node.payload = null
  bump()
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

const START_PATH = ['vikOS', 'secure_vault']

function fileSize(node) {
  const n = node.payload ? node.payload.ciphertext.length : node.content.length
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`
}

function Message({ message }) {
  if (!message) return null
  const tone = message.tone === 'error' ? 'border-crimson-700/60 bg-crimson-950 text-crimson-300' : 'border-white/[0.08] bg-obsidian-950/70 text-bone-dim'
  return (
    <p role="status" className={`mt-3 rounded-sm border px-3 py-2 text-xs ${tone}`}>
      {message.text}
    </p>
  )
}

function PassphraseField({ label, value, onChange, onEnter, autoFocus }) {
  return (
    <label className="block">
      <span className="vik-label">{label}</span>
      <input
        type="password"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.()
        }}
        autoComplete="off"
        spellCheck={false}
        className="mt-1.5 w-full rounded-sm border border-white/[0.08] bg-obsidian-950/80 px-3 py-2 font-mono text-sm text-bone placeholder:text-mist focus:border-crimson-600/70 focus:outline-none"
        style={{ userSelect: 'text' }}
      />
    </label>
  )
}

function ActionButton({ children, onClick, disabled, variant = 'primary', icon: Icon }) {
  const styles =
    variant === 'primary'
      ? 'border-crimson-600/70 bg-crimson-900/40 text-bone hover:bg-crimson-800/50'
      : 'border-white/[0.1] bg-obsidian-900 text-bone-dim hover:border-white/[0.2] hover:text-bone'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`vik-focus flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${styles}`}
    >
      {Icon && <Icon size={14} strokeWidth={1.7} />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Inspector: preview + security actions for the selected file         */
/* ------------------------------------------------------------------ */

function Inspector({ name, node, unlockedText, onUnlocked, onRelock }) {
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  const encrypted = Boolean(node.payload)
  const cryptoReady = isCryptoAvailable()

  const run = async (task) => {
    setBusy(true)
    setMessage(null)
    try {
      await task()
    } catch (err) {
      sound.error()
      setMessage({ tone: 'error', text: err instanceof CryptoError ? err.message : 'Something went wrong.' })
    } finally {
      setBusy(false)
    }
  }

  const lock = () =>
    run(async () => {
      if (pass.length < 8) throw new CryptoError('Use a passphrase of at least 8 characters.')
      if (pass !== confirm) throw new CryptoError('The passphrases do not match.')
      const payload = await encryptText(node.content, pass)
      setEncrypted(node, payload)
      setPass('')
      setConfirm('')
      sound.on()
      setMessage({ tone: 'ok', text: 'File locked. Remember the passphrase: it cannot be recovered.' })
    })

  const unlock = () =>
    run(async () => {
      if (!pass) throw new CryptoError('Enter the passphrase.')
      const text = await decryptText(node.payload, pass)
      onUnlocked(text)
      setPass('')
      sound.on()
    })

  const removeEncryption = () => {
    setPlain(node, unlockedText)
    onRelock()
    sound.on()
    setMessage({ tone: 'ok', text: 'Encryption removed. The file is plain text again.' })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-white/[0.08] bg-obsidian-950/70 text-crimson-300">
          {encrypted ? (unlockedText !== undefined ? <ShieldCheck size={18} /> : <Lock size={18} />) : <FileText size={18} />}
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-bone">{name}</p>
          <p className="mt-0.5 text-xs text-ash">
            {fileSize(node)} &middot;{' '}
            {encrypted ? (unlockedText !== undefined ? 'Encrypted, unlocked for viewing' : 'Encrypted (AES-GCM-256)') : 'Plain text'}
            {node.sensitive && <span className="ml-2 text-crimson-400">Sensitive</span>}
          </p>
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="vik-label mb-1.5">
          {encrypted && unlockedText === undefined ? 'Ciphertext (base64)' : 'Contents'}
        </p>
        <pre
          className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-sm border border-white/[0.06] bg-obsidian-950/80 p-3 font-mono text-[12px] leading-relaxed text-bone-dim"
          style={{ userSelect: 'text' }}
        >
          {encrypted && unlockedText === undefined
            ? `${node.payload.ciphertext.slice(0, 220)}${node.payload.ciphertext.length > 220 ? '…' : ''}`
            : encrypted
              ? unlockedText
              : node.content || '(empty file)'}
        </pre>
      </div>

      {/* Security panel */}
      <div className="border-t border-white/[0.06] pt-4">
        <p className="vik-label mb-3 flex items-center gap-2">
          <KeyRound size={12} /> Security
        </p>

        {!cryptoReady && (
          <Message message={{ tone: 'error', text: 'WebCrypto is unavailable here. Open vikOS on localhost or HTTPS.' }} />
        )}

        {/* Plain file: offer to lock */}
        {!encrypted && (
          <div className="space-y-3">
            <PassphraseField label="Passphrase" value={pass} onChange={setPass} />
            <PassphraseField label="Confirm passphrase" value={confirm} onChange={setConfirm} onEnter={lock} />
            <ActionButton onClick={lock} disabled={busy || !cryptoReady} icon={Lock}>
              {busy ? 'Encrypting…' : 'Lock file'}
            </ActionButton>
            <p className="text-[11px] leading-relaxed text-mist">
              Derives a 256-bit key with PBKDF2 (600,000 rounds) and encrypts with AES-GCM. There is no recovery if you forget the passphrase.
            </p>
          </div>
        )}

        {/* Encrypted and still locked: offer to unlock */}
        {encrypted && unlockedText === undefined && (
          <div className="space-y-3">
            <PassphraseField label="Passphrase" value={pass} onChange={setPass} onEnter={unlock} autoFocus />
            <ActionButton onClick={unlock} disabled={busy || !cryptoReady} icon={KeyRound}>
              {busy ? 'Deriving key…' : 'Unlock to view'}
            </ActionButton>
          </div>
        )}

        {/* Encrypted and unlocked for viewing */}
        {encrypted && unlockedText !== undefined && (
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={onRelock} variant="secondary" icon={Lock}>
              Lock view
            </ActionButton>
            <ActionButton onClick={removeEncryption} variant="secondary" icon={EyeOff}>
              Remove encryption
            </ActionButton>
          </div>
        )}

        <Message message={message} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function FileExplorer() {
  useSyncExternalStore(subscribe, getVersion) // re-render when a file is locked/unlocked

  const [path, setPath] = useState(START_PATH)
  const [selected, setSelected] = useState(null)
  const [showHidden, setShowHidden] = useState(false)
  const [unlocked, setUnlocked] = useState({}) // full path -> decrypted text (memory only)
  const [narrow, setNarrow] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < 620))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const folder = getNode(path)
  const names = Object.keys(folder.children)
    .filter((n) => showHidden || !n.startsWith('.'))
    .sort((a, b) => {
      const aDir = folder.children[a].type === 'dir'
      const bDir = folder.children[b].type === 'dir'
      if (aDir !== bDir) return aDir ? -1 : 1
      return a.localeCompare(b)
    })

  const selectedNode = selected && folder.children[selected] ? folder.children[selected] : null
  const selectedKey = selected ? [...path, selected].join('/') : null

  const goTo = (nextPath) => {
    setPath(nextPath)
    setSelected(null)
  }

  const openEntry = (name) => {
    const node = folder.children[name]
    if (node.type === 'dir') goTo([...path, name])
    else setSelected(name)
  }

  const crumbs = [{ label: '~', path: [] }, ...path.map((p, i) => ({ label: p, path: path.slice(0, i + 1) }))]

  return (
    <div ref={rootRef} className="flex h-full min-h-0 w-full flex-col bg-obsidian-950/80">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2">
        <button
          type="button"
          onClick={() => goTo(path.slice(0, -1))}
          disabled={path.length === 0}
          aria-label="Go up one folder"
          className="vik-focus grid h-7 w-7 shrink-0 place-items-center rounded-sm text-ash transition-colors hover:bg-white/[0.06] hover:text-bone disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowUp size={15} />
        </button>

        <nav aria-label="Path" className="flex min-w-0 flex-1 items-center overflow-x-auto font-mono text-xs">
          {crumbs.map((c, i) => (
            <span key={c.path.join('/') || 'home'} className="flex shrink-0 items-center">
              {i > 0 && <ChevronRight size={12} className="mx-0.5 text-mist" />}
              <button
                type="button"
                onClick={() => goTo(c.path)}
                className={`vik-focus rounded-sm px-1.5 py-1 transition-colors hover:bg-white/[0.06] ${
                  i === crumbs.length - 1 ? 'text-bone' : 'text-ash'
                }`}
              >
                {c.label}
              </button>
            </span>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setShowHidden((v) => !v)}
          aria-pressed={showHidden}
          aria-label={showHidden ? 'Hide hidden files' : 'Show hidden files'}
          title={showHidden ? 'Hide hidden files' : 'Show hidden files'}
          className={`vik-focus grid h-7 w-7 shrink-0 place-items-center rounded-sm transition-colors hover:bg-white/[0.06] ${
            showHidden ? 'text-crimson-300' : 'text-ash'
          }`}
        >
          {showHidden ? <Eye size={15} /> : <EyeOff size={15} />}
        </button>
      </div>

      {/* Body */}
      <div className={`flex min-h-0 flex-1 ${narrow ? 'flex-col' : 'flex-row'}`}>
        {/* File list */}
        <ul
          aria-label="Files"
          className={`min-h-0 overflow-y-auto p-2 ${
            narrow ? 'max-h-[40%] shrink-0 border-b border-white/[0.05]' : 'w-[44%] min-w-[13rem] border-r border-white/[0.05]'
          }`}
        >
          {names.length === 0 && <li className="px-3 py-8 text-center text-sm text-ash">This folder is empty.</li>}
          {names.map((name) => {
            const node = folder.children[name]
            const isDir = node.type === 'dir'
            const isSelected = selected === name
            const locked = !isDir && Boolean(node.payload)
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => (isDir ? setSelected(null) : setSelected(name))}
                  onDoubleClick={() => openEntry(name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openEntry(name)
                  }}
                  className={`vik-focus flex w-full items-center gap-3 rounded-sm border px-2.5 py-2 text-left transition-colors ${
                    isSelected ? 'border-crimson-600/50 bg-crimson-900/25' : 'border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  {isDir ? (
                    <Folder size={16} strokeWidth={1.5} className="shrink-0 text-crimson-300" />
                  ) : locked ? (
                    <Lock size={16} strokeWidth={1.5} className="shrink-0 text-crimson-400" />
                  ) : (
                    <FileIcon size={16} strokeWidth={1.5} className="shrink-0 text-ash" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-bone">{name}</span>
                  <span className="shrink-0 font-mono text-[10px] text-mist">{isDir ? 'folder' : fileSize(node)}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Inspector */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {selectedNode && selectedNode.type === 'file' ? (
            <Inspector
              key={selectedKey}
              name={selected}
              node={selectedNode}
              unlockedText={unlocked[selectedKey]}
              onUnlocked={(text) => setUnlocked((prev) => ({ ...prev, [selectedKey]: text }))}
              onRelock={() =>
                setUnlocked((prev) => {
                  const next = { ...prev }
                  delete next[selectedKey]
                  return next
                })
              }
            />
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <Lock size={22} strokeWidth={1.4} className="mx-auto text-mist" />
                <p className="mt-3 text-sm text-ash">Select a file to inspect it.</p>
                <p className="mt-1 text-xs text-mist">Double-click a folder to open it.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}