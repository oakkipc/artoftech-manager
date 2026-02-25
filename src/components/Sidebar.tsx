'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Users,
    FolderKanban,
    UserCircle,
    LogOut,
    Shield,
    Settings,
    ChevronRight
} from 'lucide-react'

const navItems = [
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
    { name: 'Profile', href: '/profile', icon: UserCircle },
]

export function Sidebar() {
    const pathname = usePathname()

    const handleLogout = () => {
        localStorage.removeItem('user')
        window.location.href = '/login'
    }

    return (
        <aside className="w-72 glass-dark border-r border-white/5 flex flex-col h-screen sticky top-0">
            <div className="p-8">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20 group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">AOT Manager</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <div className="text-xs font-semibold text-midnight-500 uppercase tracking-wider px-4 mb-4">
                    Management
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-midnight-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-violet-400 transition-colors'}`} />
                                <span className="font-medium">{item.name}</span>
                            </div>
                            {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="glass bg-white/5 rounded-[2rem] p-4 border border-white/5 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-midnight-800 border border-white/10 flex items-center justify-center text-violet-400 font-bold">
                            A
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">Admin User</p>
                            <p className="text-xs text-midnight-500 truncate">Administrator</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-midnight-400 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all duration-300"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    )
}
