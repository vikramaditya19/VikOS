import {
  Folder,
  Terminal,
  Globe,
  FileText,
  Settings,
  Calculator,
  Images,
  Music,
  Activity,
} from 'lucide-react'

export const APPS = [
  { id: 'files', name: 'File Explorer', icon: Folder, blurb: 'Browse the virtual filesystem of vikOS.' },
  { id: 'terminal', name: 'Terminal', icon: Terminal, blurb: 'A safe, sandboxed command line.' },
  { id: 'browser', name: 'Browser', icon: Globe, blurb: 'Browse pages from inside vikOS.' },
  { id: 'notes', name: 'Notes', icon: FileText, blurb: 'Write and keep your notes.' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, blurb: 'Quick arithmetic.' },
  { id: 'gallery', name: 'Gallery', icon: Images, blurb: 'View your images.' },
  { id: 'music', name: 'Music', icon: Music, blurb: 'Play your music.' },
  { id: 'monitor', name: 'System Monitor', icon: Activity, blurb: 'Watch the pulse of the system.' },
  { id: 'settings', name: 'Settings', icon: Settings, blurb: 'Tune the look and behavior of vikOS.' },
]

export const getApp = (id) => APPS.find((app) => app.id === id)