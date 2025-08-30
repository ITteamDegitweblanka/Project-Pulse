
import React from 'react';
import { Team, TeamMember, Role } from '../types';
import Card from './ui/Card';
import { Icon } from './ui/Icon';

interface TeamPageProps {
  teams: Team[];
  teamMembers: TeamMember[];
  viewingTeamId: string | null;
  onSelectTeam: (teamId: string) => void;
  onBackFromTeamView: () => void;
  onSelectMember: (memberId: string) => void;
}

const MemberCard: React.FC<{ member: TeamMember; onSelectMember: (memberId: string) => void; }> = ({ member, onSelectMember }) => {
    return (
        <div onClick={() => onSelectMember(member.id)} className="group relative flex flex-col items-center text-center p-3 rounded-lg bg-light-bg dark:bg-dark-bg/50 transition-all hover:scale-105 hover:bg-light-border dark:hover:bg-dark-border/50 cursor-pointer">
            <img src={member.avatarUrl} alt={member.name} className="w-20 h-20 rounded-full mb-3 ring-2 ring-light-border dark:ring-dark-border" />
            <p className="font-medium text-light-text-primary dark:text-dark-text-primary text-sm">{member.name}</p>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">{member.role}</p>
        </div>
    );
};

const TeamDetailView: React.FC<{
    team: Team;
    members: TeamMember[];
    onBack: () => void;
    onSelectMember: (memberId: string) => void;
}> = ({ team, members, onBack, onSelectMember }) => {
    const leader = members.find(m => m.role === Role.TeamLeader);
    const subLeaders = members.filter(m => m.role === Role.SubTeamLeader);
    const staff = members.filter(m => m.role === Role.Staff);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 rounded-full bg-light-card dark:bg-dark-card hover:bg-light-border dark:hover:bg-dark-border transition-colors">
                    <Icon name="arrow-left" className="h-5 w-5 text-light-text-primary dark:text-dark-text-primary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{team.name}</h1>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{team.description}</p>
                </div>
            </div>

            {leader && (
                <Card className="p-6">
                    <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Team Leader</h2>
                    <div className="inline-block">
                        <MemberCard member={leader} onSelectMember={onSelectMember} />
                    </div>
                </Card>
            )}

            {subLeaders.length > 0 && (
                 <Card className="p-6">
                    <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Sub-Team Leaders</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {subLeaders.map(member => <MemberCard key={member.id} member={member} onSelectMember={onSelectMember} />)}
                    </div>
                </Card>
            )}
            
            {staff.length > 0 && (
                 <Card className="p-6">
                    <h2 className="text-xl font-semibold text-light-text-primary dark:text-dark-text-primary mb-4">Staff</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {staff.map(member => <MemberCard key={member.id} member={member} onSelectMember={onSelectMember} />)}
                    </div>
                </Card>
            )}
        </div>
    );
};


const AllTeamsView: React.FC<{
    teams: Team[];
    teamMembers: TeamMember[];
    onSelectTeam: (teamId: string) => void;
}> = ({ teams, teamMembers, onSelectTeam }) => {
    return (
        <div className="space-y-6 animate-fade-in">
             <div>
                <h1 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">Team Directory</h1>
                <p className="mt-1 text-light-text-secondary dark:text-dark-text-secondary">Browse teams to see their structure and members.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => {
                    const membersInTeam = teamMembers.filter(m => m.teamId === team.id);
                    const leader = membersInTeam.find(m => m.role === Role.TeamLeader);
                    return (
                        <Card key={team.id} onClick={() => onSelectTeam(team.id)} className="p-6 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                           <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{team.name}</h2>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1 h-10">{team.description}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-light-text-secondary dark:text-dark-text-secondary">
                                    <Icon name="users" className="h-4 w-4" />
                                    <span className="font-semibold text-sm">{membersInTeam.length}</span>
                                </div>
                           </div>
                           <div className="mt-6 pt-4 border-t border-light-border dark:border-dark-border">
                                {leader ? (
                                    <div className="flex items-center gap-3">
                                        <img src={leader.avatarUrl} alt={leader.name} className="w-10 h-10 rounded-full" />
                                        <div>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Team Leader</p>
                                            <p className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{leader.name}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 h-[48px]">
                                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary italic">No team leader assigned.</p>
                                    </div>
                                )}
                           </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};


const TeamPage: React.FC<TeamPageProps> = (props) => {
    const { teams, teamMembers, viewingTeamId, onBackFromTeamView, onSelectTeam, onSelectMember } = props;

    if (viewingTeamId) {
        const selectedTeam = teams.find(t => t.id === viewingTeamId);
        if (!selectedTeam) {
            // This can happen if team is deleted while being viewed. Fallback gracefully.
             return (
                <AllTeamsView teams={teams} teamMembers={teamMembers} onSelectTeam={onSelectTeam} />
            );
        }
        const membersOfTeam = teamMembers.filter(m => m.teamId === viewingTeamId);

        return <TeamDetailView team={selectedTeam} members={membersOfTeam} onBack={onBackFromTeamView} onSelectMember={onSelectMember} />
    }

    return <AllTeamsView teams={teams} teamMembers={teamMembers} onSelectTeam={onSelectTeam} />;
};

export default TeamPage;