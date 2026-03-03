'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
    isCollapsed: boolean
    isOpen: boolean
    toggleCollapse: () => void
    toggleOpen: () => void
    setIsOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Load collapsed state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar_collapsed')
        if (savedState !== null) {
            setIsCollapsed(JSON.parse(savedState))
        }
    }, [])

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            const newState = !prev
            localStorage.setItem('sidebar_collapsed', JSON.stringify(newState))
            return newState
        })
    }

    const toggleOpen = () => setIsOpen(prev => !prev)

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            isOpen,
            toggleCollapse,
            toggleOpen,
            setIsOpen
        }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
