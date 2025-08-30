
import React, { useMemo, useState, useEffect } from 'react';
import { Icon } from './ui/Icon';
import { Role, TeamMember } from '../types';

const isLeader = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader, Role.TeamLeader, Role.SubTeamLeader].includes(role);
const isAdmin = (role: Role) => [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader].includes(role);

const allNavItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard' as const, roles: Object.values(Role) },
    { 
        id: 'projects-menu', 
        name: 'Projects', 
        icon: 'briefcase' as const, 
        roles: Object.values(Role),
        children: [
            { id: 'projects', name: 'All Projects', roles: Object.values(Role) },
            { id: 'technical-team', name: 'Technical Team', roles: [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader, Role.TeamLeader] },
        ]
    },
    { id: 'todo', name: 'To Do', icon: 'check-circle' as const, roles: Object.values(Role) },
    { id: 'team', name: 'Team', icon: 'users' as const, roles: [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader, Role.TeamLeader, Role.SubTeamLeader] },
    { id: 'risks-issues', name: 'Blocked & Issues', icon: 'alert-triangle' as const, roles: [Role.MD, Role.Director, Role.AdminManager, Role.OperationManager, Role.SuperLeader, Role.TeamLeader, Role.SubTeamLeader] },
    { id: 'settings', name: 'Settings & Administration', icon: 'settings' as const, roles: [Role.MD, Role.Director, Role.AdminManager] },
];

interface SidebarProps {
    activeTab: string;
    onTabChange: (id: string) => void;
    isCollapsed: boolean;
    onToggle: () => void;
    currentUser: TeamMember;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, isCollapsed, onToggle, currentUser }) => {
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    const navItems = useMemo(() => {
        return allNavItems
            .map(item => {
                if (item.children) {
                    const visibleChildren = item.children.filter(child => child.roles.includes(currentUser.role));
                    if (visibleChildren.length > 0) {
                        return { ...item, children: visibleChildren };
                    }
                    return null;
                }
                return item.roles.includes(currentUser.role) ? item : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [currentUser.role]);

    useEffect(() => {
        const activeParent = navItems.find(item => item.children?.some(child => child.id === activeTab));
        if (activeParent) {
            setOpenMenus(prev => ({ ...prev, [activeParent.id]: true }));
        }
    }, [activeTab, navItems]);

    const toggleMenu = (id: string) => {
        setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <aside className={`fixed top-0 left-0 h-full bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex flex-col z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center gap-3 h-20 border-b border-light-border dark:border-dark-border px-6 flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
                <Icon name="logo" className="h-8 w-8 text-brand-primary flex-shrink-0" />
                <h1 className={`text-2xl font-bold text-light-text-primary dark:text-dark-text-primary tracking-tight whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    Project Pulse
                </h1>
            </div>
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <ul className="space-y-2">
                    {navItems.map((item) => {
                        if (item.children) {
                            const isMenuOpen = !!openMenus[item.id];
                            const isMenuActive = item.children.some(child => child.id === activeTab);
                            
                            return (
                                <li key={item.id} className="relative group">
                                    <button
                                        onClick={() => !isCollapsed && toggleMenu(item.id)}
                                        className={`w-full flex items-center justify-between gap-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-inset
                                            ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                                            ${isMenuActive
                                                ? 'bg-brand-primary/10 text-brand-primary'
                                                : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border/50 hover:text-light-text-primary dark:hover:text-dark-text-primary'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
                                            <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.name}</span>
                                        </div>
                                        {!isCollapsed && (
                                            <Icon name="chevron-down" className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>
                                     {isCollapsed && (
                                       <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                           {item.name}
                                       </div>
                                    )}
                                    {isMenuOpen && !isCollapsed && (
                                        <ul className="pl-8 pt-2 space-y-1 animate-fade-in">
                                            {item.children.map(child => {
                                                const isChildActive = child.id === activeTab;
                                                return (
                                                    <li key={child.id}>
                                                        <button
                                                            onClick={() => onTabChange(child.id)}
                                                            className={`w-full text-left flex items-center gap-3 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 relative
                                                                ${isChildActive
                                                                    ? 'text-brand-primary'
                                                                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                                                                }`}
                                                        >
                                                             {isChildActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-md bg-brand-primary"></div>}
                                                            {child.name}
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    )}
                                </li>
                            );
                        }

                        const isActive = item.id === activeTab;
                        return (
                            <li key={item.id} className="relative group">
                                <button
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-inset
                                        ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                                        ${isActive
                                            ? 'bg-brand-primary/10 text-brand-primary'
                                            : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border/50 hover:text-light-text-primary dark:hover:text-dark-text-primary'
                                        }`}
                                >
                                    <Icon name={item.icon} className="h-5 w-5 flex-shrink-0" />
                                    <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.name}</span>
                                </button>
                                {isCollapsed && (
                                   <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                                       {item.name}
                                   </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>
            <div className="mt-auto border-t border-light-border dark:border-dark-border p-4">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200 text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border/50 hover:text-light-text-primary dark:hover:text-dark-text-primary"
                >
                    <Icon name="chevrons-left" className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
                    <span className={`whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>Collapse</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
