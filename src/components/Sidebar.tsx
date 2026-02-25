'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Users,
    FolderKanban,
    UserCircle,
    LogOut,
    Shield,
    ChevronRight,
    LayoutDashboard,
    Menu,
    X
} from 'lucide-react'

const navItems = [
    {
        label: 'MAIN',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        label: 'MANAGEMENT',
        items: [
            { name: 'Users', href: '/admin/users', icon: Users },
            { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
        ]
    },
    {
        label: 'ACCOUNT',
        items: [
            { name: 'Profile', href: '/profile', icon: UserCircle },
        ]
    }
]

export function Sidebar() {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            setUser(JSON.parse(userStr))
        }
    }, [])

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
                onClick={() => setCollapsed(!collapsed)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 glass-dark rounded-xl border border-white/10"
            >
                {collapsed ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>

            {/* Overlay for mobile */}
            {collapsed && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={() => setCollapsed(false)}
                />
            )}

            <aside className={`
        fixed lg:sticky top-0 left-0 h-screen z-40
        w-[280px] flex flex-col
        bg-[#0a0a1a]/95 backdrop-blur-2xl
        border-r border-white/[0.06]
        transition-transform duration-300
        ${collapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                {/* Brand */}
                <div className="p-6 pb-4">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/25 group-hover:shadow-violet-600/40 group-hover:scale-105 transition-all duration-300">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg font-bold text-white tracking-tight block leading-tight">AOT Manager</span>
                            <span className="text-[10px] font-semibold text-midnight-500 uppercase tracking-[0.2em]">Admin Panel</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 overflow-y-auto custom-scrollbar">
                    {navItems.map((group) => (
                        <div key={group.label} className="mb-6">
                            <div className="text-[10px] font-bold text-midnight-600 uppercase tracking-[0.2em] px-4 mb-2">
                                {group.label}
                            </div>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setCollapsed(false)}
                                            className={`
                        flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group/item
                        ${isActive
                                                    ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/10 text-white border border-violet-500/20'
                                                    : 'text-midnight-400 hover:bg-white/[0.04] hover:text-white border border-transparent'
                                                }
                      `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-violet-400' : 'text-midnight-500 group-hover/item:text-violet-400 transition-colors'}`} />
                                                <span className="text-sm font-medium">{item.name}</span>
                                            </div>
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-sm shadow-violet-400/50" />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-3 mt-auto border-t border-white/[0.04]">
                    {user && (
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                    <p className="text-[11px] text-midnight-500 truncate">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-midnight-500 hover:text-red-400 hover:bg-red-500/[0.06] rounded-xl transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>
        </>
    )
}
