import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  EnvelopeIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
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
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RectangleGroupIcon,
  BoltIcon,
  CloudIcon,
  PhotoIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

interface NavGroup {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  items?: NavItem[]
  collapsible?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
      { to: '/', icon: HomeIcon, label: 'Dashboard' },
      { to: '/revenue-report', icon: CurrencyDollarIcon, label: 'Revenue Report' },
    ],
  },
  {
    label: 'Production',
    icon: MegaphoneIcon,
    collapsible: true,
    items: [
      { to: '/campaign-send', icon: MegaphoneIcon, label: 'Send Page' },
      { to: '/campaign', icon: RectangleGroupIcon, label: 'Campaign Drops Monitor' },
      { to: '/campaign-tests', icon: ClipboardDocumentListIcon, label: 'Campaign Tests Monitor' },
      { to: '/upload-images', icon: PhotoIcon, label: 'Upload Images' },
    ],
  },
  {
    label: 'Predefined Headers',
    icon: RectangleGroupIcon,
    collapsible: true,
    items: [
      { to: '/headers/add', icon: RectangleGroupIcon, label: 'Add Headers' },
      { to: '/headers', icon: ListBulletIcon, label: 'Headers List' },
    ],
  },
  {
    label: 'AutoResponders',
    icon: BoltIcon,
    collapsible: true,
    items: [
      { to: '/auto-responders/create', icon: BoltIcon, label: 'Create AutoResponders' },
      { to: '/auto-responders', icon: ListBulletIcon, label: 'AutoResponders List' },
    ],
  },
  {
    label: 'Settings',
    icon: Cog6ToothIcon,
    collapsible: true,
    items: [
      { to: '/audit-logs', icon: DocumentMagnifyingGlassIcon, label: 'Audit Logs' },
      { to: '/settings', icon: Cog6ToothIcon, label: 'Application Settings' },
      { to: '/logs/frontend', icon: ComputerDesktopIcon, label: 'Frontend Logs' },
      { to: '/logs/backend', icon: ServerIcon, label: 'Backend Logs' },
      { to: '/sessions', icon: UsersIcon, label: 'Active Sessions' },
    ],
  },
  {
    label: 'Users',
    icon: UsersIcon,
    collapsible: true,
    items: [
      { to: '/users/add', icon: UserPlusIcon, label: 'Add Users' },
      { to: '/users', icon: ListBulletIcon, label: 'Users List' },
    ],
  },
  {
    label: 'Application Roles',
    icon: ShieldCheckIcon,
    collapsible: true,
    items: [
      { to: '/roles/add', icon: ShieldCheckIcon, label: 'Add Roles' },
      { to: '/roles', icon: ListBulletIcon, label: 'Roles List' },
      { to: '/roles/assign', icon: UserPlusIcon, label: 'Assign Roles to Users' },
      { to: '/roles/users', icon: UsersIcon, label: 'Users by Role' },
    ],
  },
  {
    label: 'Teams',
    icon: UserGroupIcon,
    collapsible: true,
    items: [
      { to: '/teams/add', icon: UserGroupIcon, label: 'Add Teams' },
      { to: '/teams', icon: ListBulletIcon, label: 'Teams List' },
      { to: '/teams/authorizations', icon: ShieldCheckIcon, label: 'Team Authorizations' },
      { to: '/teams/users', icon: UsersIcon, label: 'Assign Users to Teams' },
    ],
  },
  {
    label: 'Tools',
    icon: WrenchScrewdriverIcon,
    collapsible: true,
    items: [
      { to: '/tools/spf-lookup', icon: WrenchScrewdriverIcon, label: 'SPF Checker' },
      { to: '/tools/reputation', icon: ShieldCheckIcon, label: 'Domain/IP Reputation' },
      { to: '/tools/mailbox-extractor', icon: EnvelopeIcon, label: 'Mailbox Extractor' },
      { to: '/tools/extractor', icon: DocumentMagnifyingGlassIcon, label: 'Value Extractor' },
    ],
  },
  {
    label: 'Affiliate Networks',
    icon: CircleStackIcon,
    collapsible: true,
    items: [
      { to: '/affiliate-networks/add', icon: CircleStackIcon, label: 'Add Networks' },
      { to: '/affiliate-networks', icon: ListBulletIcon, label: 'Networks List' },
    ],
  },
  {
    label: 'Offers',
    icon: GiftIcon,
    collapsible: true,
    items: [
      { to: '/offers/add', icon: GiftIcon, label: 'Add Offers' },
      { to: '/offers', icon: ListBulletIcon, label: 'Offers List' },
      { to: '/suppressions', icon: NoSymbolIcon, label: 'Upload Suppression' },
    ],
  },
  {
    label: 'Verticals',
    icon: TagIcon,
    collapsible: true,
    items: [
      { to: '/verticals/add', icon: TagIcon, label: 'Add Verticals' },
      { to: '/verticals', icon: ListBulletIcon, label: 'Verticals List' },
    ],
  },
  {
    label: 'Clients Management',
    icon: EnvelopeIcon,
    collapsible: true,
    items: [
      { to: '/google-accounts', icon: CloudIcon, label: 'Google Workspace Accounts' },
      { to: '/data-providers/add', icon: BuildingOfficeIcon, label: 'Add Data Providers' },
      { to: '/data-providers', icon: ListBulletIcon, label: 'Data Providers List' },
      { to: '/data-lists', icon: ListBulletIcon, label: 'Manage Data Lists' },
      { to: '/data-lists/fetch', icon: NoSymbolIcon, label: 'Fetch Blacklist Emails' },
      { to: '/blacklists', icon: NoSymbolIcon, label: 'Manage Blacklists' },
      { to: '/credentials', icon: KeyIcon, label: 'Sender Credentials' },
      { to: '/email-templates', icon: RectangleGroupIcon, label: 'Email Templates' },
    ],
  },
]

function CollapsibleNavGroup({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(true)

  if (!group.collapsible || !group.items) {
    return (
      <>
        {group.label && (
          <p className="px-6 mb-1 text-xs font-semibold uppercase text-gray-400">
            {group.label}
          </p>
        )}
        {group.items?.map(item => (
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
      </>
    )
  }

  const GroupIcon = group.icon || HomeIcon

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-6 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
      >
        <GroupIcon className="h-5 w-5" />
        <span className="flex-1 text-left">{group.label}</span>
        {isOpen ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
      </button>
      {isOpen && group.items && (
        <div className="ml-4">
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
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </>
  )
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold">GAdmin Toolkit</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, gi) => (
          <div key={gi} className="mb-4">
            <CollapsibleNavGroup group={group} />
          </div>
        ))}
      </nav>
    </aside>
  )
}
