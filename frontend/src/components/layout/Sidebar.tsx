import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  QueueListIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  LinkIcon,
  GiftIcon,
  CircleStackIcon,
  ListBulletIcon,
  TagIcon,
  BuildingOfficeIcon,
  NoSymbolIcon,
  SparklesIcon,
  LinkSlashIcon,
  UserCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline'

const navGroups = [
  {
    label: '',
    items: [{ to: '/', icon: HomeIcon, label: 'Dashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/actions', icon: BoltIcon, label: 'Actions' },
      { to: '/campaign', icon: MegaphoneIcon, label: 'Campaign' },
      { to: '/offers', icon: GiftIcon, label: 'Offers' },
      { to: '/tracking-links', icon: LinkIcon, label: 'Tracking Links' },
      { to: '/jobs', icon: QueueListIcon, label: 'Jobs' },
    ],
  },
  {
    label: 'Data Management',
    items: [
      { to: '/data-providers', icon: BuildingOfficeIcon, label: 'Data Providers' },
      { to: '/data-lists', icon: ListBulletIcon, label: 'Data Lists' },
      { to: '/verticals', icon: TagIcon, label: 'Verticals' },
      { to: '/affiliate-networks', icon: CircleStackIcon, label: 'Affiliate Networks' },
      { to: '/blacklists', icon: NoSymbolIcon, label: 'Blacklists' },
    ],
  },
  {
    label: 'Offer Content',
    items: [
      { to: '/creatives', icon: SparklesIcon, label: 'Creatives' },
      { to: '/offer-links', icon: LinkSlashIcon, label: 'Offer Links' },
      { to: '/from-names', icon: UserCircleIcon, label: 'From Names' },
      { to: '/subjects', icon: ChatBubbleBottomCenterTextIcon, label: 'Subjects' },
      { to: '/suppressions', icon: ShieldExclamationIcon, label: 'Suppressions' },
      { to: '/leads', icon: UserPlusIcon, label: 'Leads' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { to: '/users', icon: UsersIcon, label: 'Users' },
      { to: '/names', icon: UserGroupIcon, label: 'Names' },
      { to: '/email-data', icon: EnvelopeIcon, label: 'Email Data' },
    ],
  },
  {
    label: 'Email Config',
    items: [
      { to: '/email-info', icon: InformationCircleIcon, label: 'Email Info' },
      { to: '/email-templates', icon: DocumentTextIcon, label: 'Templates' },
      { to: '/credentials', icon: KeyIcon, label: 'Credentials' },
    ],
  },
  {
    label: 'Logs',
    items: [
      { to: '/email-logs', icon: ClipboardDocumentListIcon, label: 'Email Logs' },
      { to: '/bounce-logs', icon: ExclamationTriangleIcon, label: 'Bounce Logs' },
      { to: '/audit-logs', icon: DocumentMagnifyingGlassIcon, label: 'Audit Logs' },
    ],
  },
  {
    label: '',
    items: [{ to: '/settings', icon: Cog6ToothIcon, label: 'Settings' }],
  },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold">GAdmin Toolkit</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {group.label && (
              <p className="px-6 mb-1 text-xs font-semibold uppercase text-gray-400">
                {group.label}
              </p>
            )}
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
