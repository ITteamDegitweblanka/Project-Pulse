import React, { useState, useEffect } from 'react';
import { Leave, TeamMember } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface AddLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLeave: (leave: Omit<Leave, 'id'>) => void;
  member: TeamMember | null;
  teamMembers: TeamMember[];
}

const AddLeaveModal: React.FC<AddLeaveModalProps> = ({ isOpen, onClose, onAddLeave, member, teamMembers }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // If a member is pre-selected, use their ID. Otherwise, default to the first team member.
      setSelectedMemberId(member?.id || (teamMembers.length > 0 ? teamMembers[0].id : ''));
      setStartDate('');
      setEndDate('');
      setReason('');
      setError('');
    }
  }, [isOpen, member, teamMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const memberIdToLog = member?.id || selectedMemberId;

    if (!memberIdToLog || !startDate || !endDate) {
      setError('A team member, start date, and end date are required.');
      return;
    }
    
    // Parse date strings as UTC to avoid timezone issues
    const [s_year, s_month, s_day] = startDate.split('-').map(Number);
    const [e_year, e_month, e_day] = endDate.split('-').map(Number);
    const startUTC = new Date(Date.UTC(s_year, s_month - 1, s_day));
    const endUTC = new Date(Date.UTC(e_year, e_month - 1, e_day));

    if (startUTC > endUTC) {
        setError('Start Date cannot be after End Date.');
        return;
    }
    
    onAddLeave({
      memberId: memberIdToLog,
      startDate: startUTC.toISOString(),
      endDate: endUTC.toISOString(),
      reason: reason.trim() || undefined,
    });
  };
  
  const today = new Date().toISOString().split('T')[0];

  const modalTitle = member ? `Log Leave for ${member.name}` : 'Log Team Member Leave';
  
  const inputStyles = "mt-1 block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";
  const selectStyles = "mt-1 block w-full pl-3 pr-10 py-2 text-base bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm rounded-md dark:text-dark-text-primary";


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="leaveMember" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Team Member
          </label>
          {member ? (
            <div className="mt-1 flex items-center gap-3 p-2 bg-light-bg dark:bg-dark-bg rounded-md">
              <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full" />
              <span className="font-medium text-light-text-primary dark:text-dark-text-primary">{member.name}</span>
            </div>
          ) : (
             <select 
               id="leaveMember" 
               value={selectedMemberId} 
               onChange={(e) => setSelectedMemberId(e.target.value)} 
               className={selectStyles}
               required
             >
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputStyles}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || today}
              className={inputStyles}
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Reason (Optional)
          </label>
          <input
            type="text"
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputStyles}
            placeholder="e.g., Vacation, Conference"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Save Leave
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddLeaveModal;