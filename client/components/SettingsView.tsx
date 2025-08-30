import React, { useState, useEffect } from 'react';
import { SystemConfiguration, ProjectPhase, Department, RiskLevelSetting, DropdownItemStatus, Team, TeamMember, Role, Tool } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { Icon } from './ui/Icon';

interface SettingsViewProps {
    systemConfiguration: SystemConfiguration | null;
    projectPhases: ProjectPhase[];
    departments: Department[];
    riskLevels: RiskLevelSetting[];
    teams: Team[];
    teamMembers: TeamMember[];
    tools: Tool[];
    currentUser: TeamMember;
    onOpenAddTeamModal: () => void;
    onOpenEditTeamModal: (team: Team) => void;
    onDeleteTeam: (teamId: string) => void;
    onOpenAddMemberModal: () => void;
    onDeleteMember: (memberId: string) => void;
    onUpdateMemberRole: (memberId: string, role: Role) => void;
    onOpenAddToolModal: () => void;
    onOpenEditToolModal: (tool: Tool) => void;
    onDeleteTool: (toolId: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const [activeTab, setActiveTab] = useState('users');

    const navItems = [
        { id: 'users', label: 'User Management' },
        { id: 'config', label: 'System Configuration' },
        { id: 'dropdowns', label: 'Dropdown Lists' },
    ];
    
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
            <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Settings & Administration</h1>
            <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Configure system settings and manage dropdown lists</p>
        </div>

        <div className="border-b border-light-border dark:border-dark-border">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {navItems.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                            tab.id === activeTab
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-gray-300 dark:hover:border-gray-700'
                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>

        <div>
            {activeTab === 'users' && <UserManagementSection {...props} />}
            {activeTab === 'config' && <SystemConfigurationSection systemConfiguration={props.systemConfiguration} />}
            {activeTab === 'dropdowns' && <DropdownsSection {...props} />}
        </div>
      </div>
    );
}

const UserManagementSection: React.FC<Omit<SettingsViewProps, 'systemConfiguration' | 'projectPhases' | 'departments' | 'riskLevels' | 'tools' | 'onOpenAddToolModal' | 'onOpenEditToolModal' | 'onDeleteTool'>> = ({
    teams, teamMembers, currentUser, onOpenAddTeamModal, onOpenEditTeamModal, onDeleteTeam, onOpenAddMemberModal, onDeleteMember, onUpdateMemberRole
}) => {
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    
    const handleDeleteTeam = (teamId: string) => {
        onDeleteTeam(teamId);
    };

    const handleDeleteMember = (member: TeamMember) => {
        if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
            onDeleteMember(member.id);
        }
    };
    
    const handleRoleChange = (memberId: string, newRole: Role) => {
        if(window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            onUpdateMemberRole(memberId, newRole);
        }
    }

    const roleColors: Record<string, string> = {
      [Role.MD]: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',
      [Role.Director]: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
      [Role.AdminManager]: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      [Role.OperationManager]: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
      [Role.SuperLeader]: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
      [Role.TeamLeader]: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
      [Role.SubTeamLeader]: 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300',
      [Role.Staff]: 'bg-slate-200 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300',
    };

    const membersToDisplay = selectedTeam ? teamMembers.filter(m => m.teamId === selectedTeam.id) : teamMembers;

    return (
        <div className="space-y-8">
            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                             <Icon name="users" className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                             <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Teams</h2>
                        </div>
                        <Button variant="secondary" onClick={onOpenAddTeamModal}>
                            <Icon name="plus" className="h-4 w-4 mr-2" />
                            Add Team
                        </Button>
                    </div>
                    <div className="overflow-x-auto -mx-6">
                        <table className="min-w-full">
                            <thead className="border-y border-light-border dark:border-dark-border">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">Team Name</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/2">Description</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Members</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-border dark:divide-dark-border">
                               {teams.map(team => (
                                   <tr key={team.id} onClick={() => setSelectedTeam(team)} className="cursor-pointer hover:bg-light-bg/50 dark:hover:bg-dark-bg/50 transition-colors">
                                       <td className="px-6 py-4 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{team.name}</td>
                                       <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{team.description}</td>
                                       <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{teamMembers.filter(m => m.teamId === team.id).length}</td>
                                       <td className="px-6 py-4">
                                           <div className="flex items-center gap-2">
                                               <button onClick={(e) => { e.stopPropagation(); onOpenEditTeamModal(team);}} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="edit" className="h-4 w-4" /></button>
                                               <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }} className="p-1.5 rounded-md hover:bg-red-500/10 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Icon name="trash" className="h-4 w-4" /></button>
                                           </div>
                                       </td>
                                   </tr>
                               ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                             <Icon name={selectedTeam ? "users" : "user"} className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                             <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">
                                {selectedTeam ? `Members of ${selectedTeam.name}` : 'All Users'}
                             </h2>
                             {selectedTeam && (
                                <Button variant="secondary" onClick={() => setSelectedTeam(null)} className="!text-xs !px-2.5 !py-1.5">Show All Users</Button>
                            )}
                        </div>
                        <Button variant="secondary" onClick={onOpenAddMemberModal}>
                            <Icon name="user-plus" className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                    <div className="overflow-x-auto -mx-6">
                        <table className="min-w-full">
                            <thead className="border-y border-light-border dark:border-dark-border">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/3">User</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">Role</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/5">Team</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/5">Office Location</th>
                                    <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-border dark:divide-dark-border">
                               {membersToDisplay.map(member => (
                                   <tr key={member.id}>
                                       <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
                                                <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{member.name}</span>
                                            </div>
                                       </td>
                                       <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                            <select 
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value as Role)}
                                                disabled={member.id === currentUser.id}
                                                className={`text-xs font-semibold p-1.5 rounded-md border-0 focus:ring-2 focus:ring-brand-primary appearance-none ${roleColors[member.role]}`}
                                            >
                                                {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                       </td>
                                       <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                           {(() => {
                                               if (!member.teamId) return 'No Team';
                                               const team = teams.find(t => String(t.id) === String(member.teamId));
                                               return team ? team.name : 'Unknown Team';
                                           })()}
                                       </td>
                                       <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">
                                           {member.officeLocation || 'N/A'}
                                       </td>
                                       <td className="px-6 py-4">
                                            <button onClick={() => handleDeleteMember(member)} disabled={member.id === currentUser.id} className="p-1.5 rounded-md hover:bg-red-500/10 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                                                <Icon name="trash" className="h-4 w-4" />
                                            </button>
                                       </td>
                                   </tr>
                               ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
        </div>
    );
};


const SystemConfigurationSection: React.FC<{systemConfiguration: SystemConfiguration | null}> = ({ systemConfiguration: initialConfig }) => {
    const [config, setConfig] = useState(initialConfig);

    useEffect(() => {
        setConfig(initialConfig);
    }, [initialConfig]);

    if (!config) {
        return <div>Loading settings...</div>;
    }

    const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prevConfig => prevConfig ? { ...prevConfig, [name]: value } : null);
    };

    const handleSaveConfig = () => {
        alert('Saving configuration is not implemented yet.');
        console.log('Saving configuration:', config);
    };
    
    const inputStyles = "block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";

    return (
        <Card>
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Icon name="settings" className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                    <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">System Configuration</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="Organization Name">
                        <input type="text" name="organizationName" value={config.organizationName} onChange={handleConfigChange} className={inputStyles} />
                    </FormField>
                    <FormField label="Notification Email">
                        <input type="email" name="notificationEmail" value={config.notificationEmail} onChange={handleConfigChange} className={inputStyles} />
                    </FormField>
                    <FormField label="Default Currency">
                        <select name="defaultCurrency" value={config.defaultCurrency} onChange={handleConfigChange} className={inputStyles}>
                            <option>USD</option>
                            <option>EUR</option>
                            <option>GBP</option>
                        </select>
                    </FormField>
                    <FormField label="Auto-escalation Days">
                        <input type="number" name="autoEscalationDays" value={config.autoEscalationDays} onChange={handleConfigChange} className={inputStyles} />
                    </FormField>
                    <FormField label="Fiscal Year Start">
                        <select name="fiscalYearStart" value={config.fiscalYearStart} onChange={handleConfigChange} className={inputStyles}>
                            <option>January</option>
                            <option>April</option>
                            <option>July</option>
                            <option>October</option>
                        </select>
                    </FormField>
                     <FormField label="Backup Frequency">
                        <select name="backupFrequency" value={config.backupFrequency} onChange={handleConfigChange} className={inputStyles}>
                            <option>Daily</option>
                            <option>Weekly</option>
                            <option>Monthly</option>
                        </select>
                    </FormField>
                </div>
                 <div className="mt-8 border-t border-light-border dark:border-dark-border pt-5 flex justify-start">
                    <Button onClick={handleSaveConfig} variant="primary">Save Configuration</Button>
                </div>
            </div>
        </Card>
    );
};

const DropdownsSection: React.FC<Omit<SettingsViewProps, 'systemConfiguration' | 'teams' | 'teamMembers' | 'currentUser' | 'onOpenAddTeamModal' | 'onOpenEditTeamModal' | 'onDeleteTeam' | 'onOpenAddMemberModal' | 'onDeleteMember' | 'onUpdateMemberRole'>> = ({
    projectPhases, departments, riskLevels, tools, onOpenAddToolModal, onOpenEditToolModal, onDeleteTool
}) => {
    const handleAddItem = (type: string) => alert(`Adding a new ${type} is not implemented yet.`);
    const handleEditItem = (type: string, id: string) => alert(`Editing ${type} ${id} is not implemented yet.`);
    const handleDeleteItem = (type: string, id: string) => alert(`Deleting ${type} ${id} is not implemented yet.`);

    return (
        <div className="space-y-8">
            <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         <Icon name="layers" className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                         <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Project Phases</h2>
                    </div>
                    <Button variant="secondary" onClick={() => handleAddItem('Phase')}>
                        <Icon name="plus" className="h-4 w-4 mr-2" />
                        Add Phase
                    </Button>
                </div>
                <div className="overflow-x-auto -mx-6">
                    <table className="min-w-full">
                        <thead className="border-y border-light-border dark:border-dark-border">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">Phase Name</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/2">Description</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border">
                           {projectPhases.map(item => (
                               <tr key={item.id}>
                                   <td className="px-6 py-4 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{item.name}</td>
                                   <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.description}</td>
                                   <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                           <button onClick={() => handleEditItem('Phase', item.id)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="edit" className="h-4 w-4" /></button>
                                           <button onClick={() => handleDeleteItem('Phase', item.id)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="trash" className="h-4 w-4" /></button>
                                       </div>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
        
        <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         <Icon name="layers" className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                         <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Departments</h2>
                    </div>
                    <Button variant="secondary" onClick={() => handleAddItem('Department')}>
                        <Icon name="plus" className="h-4 w-4 mr-2" />
                        Add Department
                    </Button>
                </div>
                <div className="overflow-x-auto -mx-6">
                    <table className="min-w-full">
                        <thead className="border-y border-light-border dark:border-dark-border">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/4">Department Name</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-1/2">Description</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border">
                           {departments.map(item => (
                               <tr key={item.id}>
                                   <td className="px-6 py-4 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{item.name}</td>
                                   <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.description}</td>
                                   <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                           <button onClick={() => handleEditItem('Department', item.id)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="edit" className="h-4 w-4" /></button>
                                           <button onClick={() => handleDeleteItem('Department', item.id)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="trash" className="h-4 w-4" /></button>
                                       </div>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>

        <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         <Icon name="layers" className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                         <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Tools Used</h2>
                    </div>
                    <Button variant="secondary" onClick={onOpenAddToolModal}>
                        <Icon name="plus" className="h-4 w-4 mr-2" />
                        Add Tool
                    </Button>
                </div>
                <div className="overflow-x-auto -mx-6">
                    <table className="min-w-full">
                        <thead className="border-y border-light-border dark:border-dark-border">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-3/4">Tool Name</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border">
                           {tools.map(item => (
                               <tr key={item.id}>
                                   <td className="px-6 py-4 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{item.name}</td>
                                   <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                           <button onClick={() => onOpenEditToolModal(item)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="edit" className="h-4 w-4" /></button>
                                           <button onClick={() => onDeleteTool(item.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-light-text-secondary dark:text-dark-text-secondary hover:text-red-500"><Icon name="trash" className="h-4 w-4" /></button>
                                       </div>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
        
        <Card>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         <Icon name="layers" className="h-6 w-6 text-light-text-primary dark:text-dark-text-primary" />
                         <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary">Risk Levels</h2>
                    </div>
                    <Button variant="secondary" onClick={() => handleAddItem('Risk Level')}>
                        <Icon name="plus" className="h-4 w-4 mr-2" />
                        Add Risk Level
                    </Button>
                </div>
                <div className="overflow-x-auto -mx-6">
                    <table className="min-w-full">
                        <thead className="border-y border-light-border dark:border-dark-border">
                            <tr>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[15%]">Risk Level</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary w-[45%]">Description</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Color</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Status</th>
                                <th className="py-3 px-6 text-left text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border">
                           {riskLevels.map(item => (
                               <tr key={item.id}>
                                   <td className="px-6 py-4 text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{item.level}</td>
                                   <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.description}</td>
                                   <td className="px-6 py-4 text-sm text-light-text-secondary dark:text-dark-text-secondary">{item.color}</td>
                                   <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                                   <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                           <button onClick={() => handleEditItem('Risk Level', item.id)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="edit" className="h-4 w-4" /></button>
                                           <button onClick={() => handleDeleteItem('Risk Level', item.id)} className="p-1.5 rounded-md hover:bg-light-border dark:hover:bg-dark-border text-light-text-secondary dark:text-dark-text-secondary"><Icon name="trash" className="h-4 w-4" /></button>
                                       </div>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
        </div>
    );
};


const StatusBadge: React.FC<{ status: DropdownItemStatus }> = ({ status }) => {
  const isActive = status === 'Active';
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${isActive ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
      {status}
    </span>
  );
};

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">{label}</label>
    {children}
  </div>
);

export default SettingsView;