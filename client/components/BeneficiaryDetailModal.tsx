import React, { useState, useMemo } from 'react';
import { TeamMember, Team, ProjectFrequency } from '../types';
import Modal from './ui/Modal';
import { Icon } from './ui/Icon';

interface ProjectDetail {
    id: string;
    name: string;
    savedHours: number;
    frequency?: ProjectFrequency;
    frequencyDetail?: string;
}

interface BeneficiaryDetails {
    totalHoursSaved: number;
    projects: ProjectDetail[];
}

interface BeneficiaryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    member: TeamMember;
    staffBeneficiaryDetails: Map<string, BeneficiaryDetails>;
    teamBeneficiaryDetails: Map<string, BeneficiaryDetails>;
  };
  allMembers: TeamMember[];
  allTeams: Team[];
}

const getFrequencyDisplay = (project: ProjectDetail) => {
    if (!project.frequency) return '-';
    let detail = '';
    if (project.frequencyDetail) {
        switch(project.frequency) {
            case ProjectFrequency.Weekly:
            case ProjectFrequency.Monthly:
            case ProjectFrequency.ThreeWeeksOnce:
                detail = `(${project.frequencyDetail})`;
                break;
            case ProjectFrequency.TwiceAMonth:
                detail = `(on the ${project.frequencyDetail.replace(',', ' & ')}th)`;
                break;
            case ProjectFrequency.SpecificDates:
                 try {
                    const dates = JSON.parse(project.frequencyDetail);
                    if (Array.isArray(dates) && dates.length > 0) {
                        detail = `(${dates.length} dates)`;
                    }
                } catch { /* ignore */ }
                break;
        }
    }
    return `${project.frequency} ${detail}`;
};

const BeneficiaryDetailModal: React.FC<BeneficiaryDetailModalProps> = ({ isOpen, onClose, data, allMembers, allTeams }) => {
    const [activeTab, setActiveTab] = useState<'staff' | 'teams'>('staff');

    const membersById = useMemo(() => new Map(allMembers.map(m => [m.id, m])), [allMembers]);
    const teamsById = useMemo(() => new Map(allTeams.map(t => [t.id, t])), [allTeams]);
    
    const sortedStaff = useMemo(() => Array.from(data.staffBeneficiaryDetails.entries()).sort(([, a], [, b]) => b.totalHoursSaved - a.totalHoursSaved), [data.staffBeneficiaryDetails]);
    const sortedTeams = useMemo(() => Array.from(data.teamBeneficiaryDetails.entries()).sort(([, a], [, b]) => b.totalHoursSaved - a.totalHoursSaved), [data.teamBeneficiaryDetails]);

    const renderStaffList = () => (
        <div className="space-y-4">
            {sortedStaff.map(([staffId, details]) => {
                const member = membersById.get(staffId);
                if (!member) return null;
                return (
                    <div key={staffId} className="p-3 bg-light-bg dark:bg-dark-bg/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
                                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{member.name}</span>
                            </div>
                            <span className="font-bold text-lg text-green-600 dark:text-green-400">{details.totalHoursSaved.toFixed(1)}h</span>
                        </div>
                        <div className="mt-3 pl-11 space-y-2 border-l-2 border-light-border dark:border-dark-border ml-4">
                            {details.projects.map((proj, index) => (
                                <div key={`${proj.id}-${index}`} className="pl-4 text-xs">
                                   <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{proj.name}</p>
                                   <p className="text-light-text-secondary dark:text-dark-text-secondary">
                                       Saved: <span className="font-semibold text-green-600 dark:text-green-400">{proj.savedHours.toFixed(1)}h</span> &bull; Frequency: {getFrequencyDisplay(proj)}
                                   </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
            {sortedStaff.length === 0 && <p className="text-sm text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">No staff beneficiaries for this member.</p>}
        </div>
    );

    const renderTeamList = () => (
         <div className="space-y-4">
            {sortedTeams.map(([teamId, details]) => {
                const team = teamsById.get(teamId);
                if (!team) return null;
                return (
                    <div key={teamId} className="p-3 bg-light-bg dark:bg-dark-bg/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-light-border dark:bg-dark-border flex items-center justify-center">
                                    <Icon name="users" className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary" />
                                </div>
                                <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{team.name}</span>
                            </div>
                            <span className="font-bold text-lg text-green-600 dark:text-green-400">{details.totalHoursSaved.toFixed(1)}h</span>
                        </div>
                        <div className="mt-3 pl-11 space-y-2 border-l-2 border-light-border dark:border-dark-border ml-4">
                            {details.projects.map((proj, index) => (
                                <div key={`${proj.id}-${index}`} className="pl-4 text-xs">
                                   <p className="font-medium text-light-text-primary dark:text-dark-text-primary">{proj.name}</p>
                                   <p className="text-light-text-secondary dark:text-dark-text-secondary">
                                       Saved: <span className="font-semibold text-green-600 dark:text-green-400">{proj.savedHours.toFixed(1)}h</span> &bull; Frequency: {getFrequencyDisplay(proj)}
                                   </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
            {sortedTeams.length === 0 && <p className="text-sm text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">No team beneficiaries for this member.</p>}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Beneficiary Breakdown for ${data.member.name}`}>
            <div className="border-b border-light-border dark:border-dark-border mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('staff')}
                        className={`${activeTab === 'staff' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-gray-300 dark:hover:border-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none flex items-center gap-2`}
                    >
                        <Icon name="user" className="h-4 w-4" /> Staff ({sortedStaff.length})
                    </button>
                     <button
                        onClick={() => setActiveTab('teams')}
                        className={`${activeTab === 'teams' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary hover:border-gray-300 dark:hover:border-gray-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none flex items-center gap-2`}
                    >
                       <Icon name="users" className="h-4 w-4" /> Teams ({sortedTeams.length})
                    </button>
                </nav>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
                {activeTab === 'staff' ? renderStaffList() : renderTeamList()}
            </div>
        </Modal>
    );
};

export default BeneficiaryDetailModal;
