'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/context/SidebarContext'
import {
    Users,
    FolderKanban,
    UserCircle,
    LogOut,
    Shield,
    LayoutDashboard,
    Menu,
    X,
    Pin,
    LayoutGrid,
    Server,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Building2,
    Activity,
    ChevronUp,
    ChevronDown,
    Settings2
} from 'lucide-react'

const navItems = [
    {
        label: 'MAIN',
        items: [
            { name: 'Projects Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Stakeholders Dashboard', href: '/admin/dashboard/stakeholders', icon: Activity },
        ]
    },
    {
        label: 'MANAGEMENT',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
            { name: 'Host & Domain', href: '/admin/hosting', icon: Server },
            { name: 'Budget', href: '/budget', icon: Wallet },
            { name: 'Vendors', href: '/admin/vendors', icon: Users },
            { name: 'Clients', href: '/admin/clients', icon: Building2 },
            { name: 'Activity Logs', href: '/admin/logs', icon: Activity },
        ]
    },
    {
        label: 'ACCOUNT',
        items: [
            { name: 'Profile', href: '/profile', icon: UserCircle },
        ]
    }
]

interface PinnedProject {
    id: string
    name: string
}

export function Sidebar() {
    const pathname = usePathname()
    const { isCollapsed, isOpen, toggleCollapse, toggleOpen, setIsOpen } = useSidebar()
    const [user, setUser] = useState<any>(null)
    const [pinnedProjects, setPinnedProjects] = useState<PinnedProject[]>([])
    const [isReordering, setIsReordering] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }
        fetchPinnedProjects()
    }, [])

    const fetchPinnedProjects = async () => {
        try {
            const res = await fetch('/api/admin/projects')
            const data = await res.json()
            if (data.projects) {
                const pinned = data.projects.filter((p: any) => p.pinned)
                setPinnedProjects(pinned)
            }
        } catch (err) {
            console.error(err)
        }
    }

    const moveProject = async (index: number, direction: 'up' | 'down') => {
        const newPinned = [...pinnedProjects]
        const targetIndex = direction === 'up' ? index - 1 : index + 1

        if (targetIndex < 0 || targetIndex >= newPinned.length) return

        // Swap
        const [moved] = newPinned.splice(index, 1)
        newPinned.splice(targetIndex, 0, moved)

        setPinnedProjects(newPinned)

        // Update Backend
        try {
            await Promise.all(newPinned.map((p, idx) =>
                fetch('/api/admin/projects', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: p.id, pinOrder: idx, userId: user?.id })
                })
            ))
        } catch (err) {
            console.error(err)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('user')
        window.location.href = '/login'
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'SUPERADMIN': return 'from-red-500 to-orange-500'
            case 'ADMIN': return 'from-violet-500 to-indigo-500'
            case 'OFFICER': return 'from-cyan-500 to-blue-500'
            default: return 'from-slate-500 to-slate-600'
        }
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={toggleOpen}
                className={`
                    fixed top-4 left-4 z-50 lg:hidden p-2.5 
                    bg-[#0a0a1a]/80 backdrop-blur-lg rounded-xl border border-white/10
                    text-white transition-all duration-300
                    ${isOpen ? 'left-[230px] rotate-90' : 'left-4 rotate-0'}
                `}
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed lg:sticky top-0 left-0 h-screen z-40
                ${isCollapsed ? 'w-[80px]' : 'w-[280px]'} flex flex-col
                bg-[#0a0a1a]/95 backdrop-blur-2xl
                border-r border-white/[0.06]
                transition-all duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Brand */}
                <div className="p-6 pb-4 relative">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/25 group-hover:shadow-violet-600/40 group-hover:scale-105 transition-all duration-300 shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="transition-opacity duration-300">
                                <span className="text-lg font-bold text-white tracking-tight block leading-tight">AOT Manager</span>
                                <span className="text-[10px] font-semibold text-midnight-500 uppercase tracking-[0.2em]">Admin Panel</span>
                            </div>
                        )}
                    </Link>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={toggleCollapse}
                        className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-violet-600 rounded-full border border-white/10 items-center justify-center text-white shadow-lg hover:bg-violet-500 transition-colors z-50"
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
                    {navItems.map((group, groupIdx) => (
                        <div key={group.label} className="mb-6">
                            {!isCollapsed && (
                                <div className="text-[10px] font-bold text-midnight-600 uppercase tracking-[0.2em] px-4 mb-2 transition-opacity duration-300">
                                    {group.label}
                                </div>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            title={isCollapsed ? item.name : undefined}
                                            className={`
                                                flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2.5 rounded-xl transition-all duration-200 group/item
                                                ${isActive
                                                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/20'
                                                    : 'text-midnight-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-violet-400' : 'text-midnight-500 group-hover/item:text-violet-400 transition-colors'}`} />
                                                {!isCollapsed && <span className="text-sm font-medium transition-opacity duration-300">{item.name}</span>}
                                            </div>
                                            {!isCollapsed && isActive && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Pinned Projects — show right after MAIN group */}
                            {groupIdx === 0 && pinnedProjects.length > 0 && (
                                <div className={`mt-3 pt-3 border-t border-white/[0.04] ${isCollapsed ? 'flex justify-center' : ''}`}>
                                    {!isCollapsed && (
                                        <div className="text-[10px] font-bold text-midnight-600 uppercase tracking-[0.2em] px-4 mb-2 flex items-center justify-between transition-opacity duration-300">
                                            <div className="flex items-center gap-1.5">
                                                <Pin className="w-3 h-3" />
                                                Pinned
                                            </div>
                                            <button
                                                onClick={() => setIsReordering(!isReordering)}
                                                className={`p-1 hover:bg-white/10 rounded-md transition-colors ${isReordering ? 'text-amber-400 bg-amber-400/10' : 'text-midnight-600'}`}
                                                title="Reorder Pinned Projects"
                                            >
                                                <Settings2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="space-y-1 w-full">
                                        {pinnedProjects.map((project) => {
                                            const isActive = pathname === `/projects/${project.id}`
                                            return (
                                                <Link
                                                    key={project.id}
                                                    href={`/projects/${project.id}`}
                                                    onClick={() => setIsOpen(false)}
                                                    title={isCollapsed ? project.name : undefined}
                                                    className={`
                                                        flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-2 rounded-xl transition-all duration-200 group/item
                                                        ${isActive
                                                            ? 'bg-gradient-to-r from-amber-600/15 to-orange-600/10 text-white border border-amber-500/20'
                                                            : 'text-midnight-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <LayoutGrid className={`w-[16px] h-[16px] shrink-0 ${isActive ? 'text-amber-400' : 'text-midnight-600 group-hover/item:text-amber-400 transition-colors'}`} />
                                                        {!isCollapsed && <span className="text-sm font-medium truncate transition-opacity duration-300">{project.name}</span>}
                                                    </div>
                                                    {!isCollapsed && isReordering ? (
                                                        <div className="flex items-center gap-1 shrink-0 animate-in fade-in slide-in-from-right-2 duration-200">
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); moveProject(pinnedProjects.indexOf(project), 'up') }}
                                                                disabled={pinnedProjects.indexOf(project) === 0}
                                                                className="p-1 hover:bg-white/10 rounded text-midnight-500 hover:text-white disabled:opacity-20"
                                                            >
                                                                <ChevronUp className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.preventDefault(); moveProject(pinnedProjects.indexOf(project), 'down') }}
                                                                disabled={pinnedProjects.indexOf(project) === pinnedProjects.length - 1}
                                                                className="p-1 hover:bg-white/10 rounded text-midnight-500 hover:text-white disabled:opacity-20"
                                                            >
                                                                <ChevronDown className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        !isCollapsed && isActive && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                                                        )
                                                    )}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-3 mt-auto border-t border-white/[0.04]">
                    {user && (
                        <div className={`p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] mb-2 ${isCollapsed ? 'flex justify-center' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white text-sm font-bold shadow-lg shrink-0`}>
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 min-w-0 transition-opacity duration-300">
                                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                        <p className="text-[11px] text-midnight-500 truncate">{user.role}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title={isCollapsed ? 'Log out' : undefined}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2.5 text-midnight-500 hover:text-red-400 hover:bg-red-500/[0.06] rounded-xl transition-all duration-200 text-sm font-medium`}
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        {!isCollapsed && <span className="transition-opacity duration-300">Log out</span>}
                    </button>
                </div>
            </aside>
        </>
    )
}
