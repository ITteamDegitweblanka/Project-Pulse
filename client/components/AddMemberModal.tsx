import React, { useState, useEffect, useMemo } from 'react';
import { Role, Team, TeamMember } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMember: (name: string, role: Role, password: string, teamId?: string, subTeamLeaderId?: string, officeLocation?: string) => void;
  teams: Team[];
  teamMembers: TeamMember[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAddMember, teams, teamMembers }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.Staff);
  const [password, setPassword] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [subTeamLeaderId, setSubTeamLeaderId] = useState<string>('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [error, setError] = useState('');

  const availableSubLeaders = useMemo(() => {
    if (!teamId || role !== Role.Staff) return [];
    return teamMembers.filter(m => m.role === Role.SubTeamLeader && m.teamId === teamId);
  }, [teamId, role, teamMembers]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setRole(Role.Staff);
      setPassword('');
      setOfficeLocation('');
      setError('');
      if (teams.length > 0) {
        setTeamId(teams[0].id);
      } else {
        setTeamId('');
      }
      setSubTeamLeaderId('');
    }
  }, [isOpen, teams]);

  useEffect(() => {
    setSubTeamLeaderId('');
    if (availableSubLeaders.length > 0) {
        setSubTeamLeaderId(availableSubLeaders[0].id);
    }
  }, [teamId, availableSubLeaders]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Member name cannot be empty.');
      return;
    }
    if (!password.trim()) {
      setError('Password cannot be empty.');
      return;
    }

    const needsTeam = [Role.Staff, Role.TeamLeader, Role.SubTeamLeader].includes(role);
    const needsSubLeader = role === Role.Staff;

    if (needsTeam && !teamId) {
        setError('A team must be selected for this role.');
        return;
    }
    if (needsSubLeader && !subTeamLeaderId) {
        setError('A sub-team leader must be selected for this role.');
        return;
    }

    onAddMember(
        name.trim(), 
        role, 
        password, 
        needsTeam ? teamId : undefined, 
        needsSubLeader ? subTeamLeaderId : undefined,
        officeLocation.trim() || undefined
    );
  };
  
  const needsTeam = [Role.Staff, Role.TeamLeader, Role.SubTeamLeader].includes(role);
  const needsSubLeader = role === Role.Staff;
  
  const inputStyles = "flex-1 block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";
  const selectStyles = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:text-dark-text-primary";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Team Member">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="memberName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Member Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="memberName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyles}
              placeholder="e.g., Jane Doe"
              autoFocus
              required
            />
          </div>
        </div>

        <div>
            <label htmlFor="officeLocation" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Office Location
            </label>
            <div className="mt-1">
                <input
                  type="text"
                  id="officeLocation"
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  className={inputStyles}
                  placeholder="e.g., New York Office, Remote"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="memberRole" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Role</label>
                <select 
                    id="memberRole" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value as Role)} 
                    className={selectStyles}
                >
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
             <div>
              <label htmlFor="memberPassword" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  id="memberPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputStyles}
                  placeholder="Enter temporary password"
                  required
                />
              </div>
            </div>
        </div>
        
        {needsTeam && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="teamId" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Team</label>
                    <select 
                        id="teamId" 
                        value={teamId} 
                        onChange={(e) => setTeamId(e.target.value)} 
                        className={selectStyles}
                        required={needsTeam}
                    >
                        <option value="" disabled>Select a team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                {needsSubLeader && (
                     <div>
                        <label htmlFor="subTeamLeaderId" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Sub-Team Leader</label>
                        <select 
                            id="subTeamLeaderId" 
                            value={subTeamLeaderId} 
                            onChange={(e) => setSubTeamLeaderId(e.target.value)} 
                            className={selectStyles}
                            disabled={availableSubLeaders.length === 0}
                            required={needsSubLeader}
                        >
                            {availableSubLeaders.length > 0 ? (
                                <>
                                 <option value="" disabled>Select a sub-team leader</option>
                                 {availableSubLeaders.map(sl => <option key={sl.id} value={sl.id}>{sl.name}</option>)}
                                </>
                            ) : (
                                <option value="" disabled>No sub-leaders in this team</option>
                            )}
                        </select>
                    </div>
                )}
            </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;