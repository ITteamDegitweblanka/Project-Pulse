import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Project, TeamMember, Team, ProjectUser, ProjectFrequency } from '../types';
import { Icon } from './ui/Icon';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (data: {
    name: string;
    allocatedHours: number;
    leadId: string;
    parentId?: string;
    weight?: number;
    users?: ProjectUser[];
    frequency?: ProjectFrequency;
    frequencyDetail?: string;
    expectedSavedHours?: number;
    description: string;
    end_date: string;
    beneficiary: string;
  }) => Promise<void>; // Updated to return Promise<void> for async handling
  onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => Promise<void>;
  teamMembers: TeamMember[];
  parentId: string | null;
  editingProject: Project | null;
  teams: Team[];
}

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthDates = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const AddProjectModal: React.FC<AddProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddProject, 
  onUpdateProject, 
  teamMembers, 
  parentId, 
  editingProject,
  teams 
}) => {
    const [name, setName] = useState('');
    const [allocatedHours, setAllocatedHours] = useState('');
    const [leadId, setLeadId] = useState<string>('');
    const [teamId, setTeamId] = useState<string>('');
    const [weight, setWeight] = useState('');
    const [description, setDescription] = useState('');
    const [endDate, setEndDate] = useState('');
    const [beneficiary, setBeneficiary] = useState('');
    const [error, setError] = useState('');

  // Lead Selector State
  const [isLeadSelectorOpen, setIsLeadSelectorOpen] = useState(false);
  const leadSelectorRef = useRef<HTMLDivElement>(null);

  // Technical Project State
  const [isTechnicalProject, setIsTechnicalProject] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState<ProjectUser[]>([]);
  const [frequency, setFrequency] = useState<ProjectFrequency>(ProjectFrequency.Daily);
  const [expectedSavedHoursPerPerson, setExpectedSavedHoursPerPerson] = useState('');
  const [isBeneficiarySelectorOpen, setIsBeneficiarySelectorOpen] = useState(false);
  const beneficiaryRef = useRef<HTMLDivElement>(null);
  const [isFrequencySelectorOpen, setIsFrequencySelectorOpen] = useState(false);
  const frequencySelectorRef = useRef<HTMLDivElement>(null);

  // Frequency Detail State
  const [frequencyDetail, setFrequencyDetail] = useState('');
  const [twiceAMonthDate1, setTwiceAMonthDate1] = useState('1');
  const [twiceAMonthDate2, setTwiceAMonthDate2] = useState('15');
  const [specificDates, setSpecificDates] = useState<string[]>([]);
  const [currentSpecificDate, setCurrentSpecificDate] = useState('');

  // Focus and render debugging
  const activeInputRef = useRef<string | null>(null);
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current += 1;
    console.log(`AddProjectModal rendered ${renderCount.current} times`);
  });

  // Cursor position for Project Description
  const descriptionCursorRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const isSubProject = !!parentId;
  const isEditMode = !!editingProject;

  const potentialLeads = useMemo(() => teamMembers, [teamMembers]);
  const technicalTeam = useMemo(() => teams.find(t => t.name === 'Technical'), [teams]);

  // Input focus tracking
  const handleInputFocus = useCallback((field: string) => {
    activeInputRef.current = field;
    console.log(`Focused on ${field}`);
  }, []);

  const handleInputBlur = useCallback((field: string) => {
    if (activeInputRef.current === field) {
      activeInputRef.current = null;
      console.log(`Blurred from ${field}`);
    }
  }, []);

  // Restore focus after render if needed
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({
  name: null,
  allocatedHours: null,
  description: null,
  endDate: null,
  beneficiary: null,
  expectedSavedHoursPerPerson: null,
  currentSpecificDate: null,
  teamId: null,
  });

  useEffect(() => {
    if (activeInputRef.current && inputRefs.current[activeInputRef.current]) {
      const input = inputRefs.current[activeInputRef.current];
      input?.focus();
      if (activeInputRef.current === 'description' && input instanceof HTMLTextAreaElement) {
        input.selectionStart = descriptionCursorRef.current.start;
        input.selectionEnd = descriptionCursorRef.current.end;
      }
    }
  });

  // Input handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  }, []);

  const handleAllocatedHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAllocatedHours(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    descriptionCursorRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    };
    setDescription(textarea.value);
    console.log(`Description changed: "${textarea.value}", cursor at ${textarea.selectionStart}`);
  }, []);

  const handleEndDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  }, []);

  const handleBeneficiaryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBeneficiary(e.target.value);
  }, []);

  const handleExpectedSavedHoursChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setExpectedSavedHoursPerPerson(e.target.value);
  }, []);

  const handleCurrentSpecificDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentSpecificDate(e.target.value);
  }, []);

  // Check if selected lead is from Technical team
  const checkTechnicalProject = useCallback(() => {
    if (leadId && technicalTeam) {
      const selectedLead = teamMembers.find(m => m.id === leadId);
      if (selectedLead && selectedLead.teamId === technicalTeam.id) {
        setIsTechnicalProject(prev => {
          if (!prev) {
            setBeneficiaries([]);
            setFrequency(ProjectFrequency.Daily);
            setExpectedSavedHoursPerPerson('');
          }
          return true;
        });
      } else {
        setIsTechnicalProject(false);
      }
    } else {
      setIsTechnicalProject(false);
    }
  }, [leadId, teamMembers, technicalTeam]);

  useEffect(() => {
    if (!isOpen) return;
    checkTechnicalProject();
  }, [isOpen, leadId, checkTechnicalProject]);

  // Reset frequency details on frequency change
  const resetFrequencyDetails = useCallback(() => {
    switch(frequency) {
      case ProjectFrequency.Weekly:
      case ProjectFrequency.ThreeWeeksOnce:
        setFrequencyDetail(weekDays[0]);
        break;
      case ProjectFrequency.Monthly:
        setFrequencyDetail(monthDates[0]);
        break;
      case ProjectFrequency.TwiceAMonth:
        setTwiceAMonthDate1('1');
        setTwiceAMonthDate2('15');
        break;
      case ProjectFrequency.SpecificDates:
        setSpecificDates([]);
        break;
      default:
        setFrequencyDetail('');
    }
  }, [frequency]);

  useEffect(() => {
    if (!isOpen) return;
    resetFrequencyDetails();
  }, [isOpen, frequency, resetFrequencyDetails]);

  // Handle click outside for custom selectors
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (beneficiaryRef.current && !beneficiaryRef.current.contains(event.target as Node)) {
      setIsBeneficiarySelectorOpen(false);
    }
    if (leadSelectorRef.current && !leadSelectorRef.current.contains(event.target as Node)) {
      setIsLeadSelectorOpen(false);
    }
    if (frequencySelectorRef.current && !frequencySelectorRef.current.contains(event.target as Node)) {
      setIsFrequencySelectorOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Populate form on open
  const populateForm = useCallback(() => {
    if (isEditMode && editingProject) {
      setName(editingProject.name || '');
      setAllocatedHours(editingProject.allocatedHours?.toString() || '');
      setLeadId(editingProject.leadId || '');
      setTeamId(editingProject.teamId?.toString() || '');
      setWeight(editingProject.weight?.toString() || '');
      setDescription(editingProject.description || '');
      setEndDate(editingProject.end_date || '');
      setBeneficiary(editingProject.beneficiary || '');

      setBeneficiaries(editingProject.users || []);
      setFrequency(editingProject.frequency || ProjectFrequency.Daily);

      const savedHoursTotal = editingProject.expectedSavedHours || 0;
      const projectBeneficiaries = editingProject.users || [];
      const beneficiaryUserIds = new Set<string>();
      projectBeneficiaries.forEach(b => {
        if (b.type === 'user') {
          beneficiaryUserIds.add(b.id);
        } else if (b.type === 'team') {
          teamMembers.forEach(tm => {
            if (tm.teamId === b.id) {
              beneficiaryUserIds.add(tm.id);
            }
          });
        }
      });
      const beneficiaryCount = beneficiaryUserIds.size > 0 ? beneficiaryUserIds.size : 1;
      const perPersonHours = savedHoursTotal / beneficiaryCount;
      setExpectedSavedHoursPerPerson(perPersonHours.toString());

      const detail = editingProject.frequencyDetail || '';
      switch(editingProject.frequency) {
        case ProjectFrequency.TwiceAMonth:
          const [d1, d2] = detail.split(',');
          setTwiceAMonthDate1(d1 || '1');
          setTwiceAMonthDate2(d2 || '15');
          break;
        case ProjectFrequency.SpecificDates:
          try {
            const dates = JSON.parse(detail);
            if (Array.isArray(dates)) setSpecificDates(dates);
          } catch {
            /* ignore */
          }
          break;
        default:
          setFrequencyDetail(detail);
      }
    } else {
      setName('');
      setAllocatedHours('');
      setLeadId('');
      setWeight('');
      setDescription('');
      setEndDate('');
      setBeneficiary('');
      setBeneficiaries([]);
      setFrequency(ProjectFrequency.Daily);
      setExpectedSavedHoursPerPerson('');
      setFrequencyDetail('');
      setTwiceAMonthDate1('1');
      setTwiceAMonthDate2('15');
      setSpecificDates([]);
    }
    setError('');
    descriptionCursorRef.current = { start: 0, end: 0 }; // Reset cursor position
  }, [editingProject, isEditMode, teamMembers]);

  useEffect(() => {
    if (!isOpen) return;
    populateForm();
  }, [isOpen, populateForm]);

  const beneficiaryCount = useMemo(() => {
    if (!isTechnicalProject) return 0;
    const beneficiaryUserIds = new Set<string>();
    beneficiaries.forEach(b => {
      if (b.type === 'user') {
        beneficiaryUserIds.add(b.id);
      } else if (b.type === 'team') {
        teamMembers.forEach(tm => {
          if (tm.teamId === b.id) {
            beneficiaryUserIds.add(tm.id);
          }
        });
      }
    });
    return beneficiaryUserIds.size;
  }, [beneficiaries, teamMembers, isTechnicalProject]);

  const totalExpectedSavedHours = useMemo(() => {
    const perPerson = parseFloat(expectedSavedHoursPerPerson);
    if (isNaN(perPerson) || beneficiaryCount === 0) return 0;
    return perPerson * beneficiaryCount;
  }, [expectedSavedHoursPerPerson, beneficiaryCount]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const hours = parseInt(allocatedHours, 10);
    const weightValue = parseInt(weight, 10);

    // Client-side validation
    if (!leadId) {
      setError('A project lead must be selected.');
      return;
    }
    if (!teamId) {
      setError('A team must be selected.');
      return;
    }
    if (!name.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    if (!description.trim()) {
      setError('Project description cannot be empty.');
      return;
    }
    if (!endDate.trim()) {
      setError('Project end date cannot be empty.');
      return;
    }
    if (!beneficiary.trim()) {
      setError('Project beneficiary cannot be empty.');
      return;
    }
    if (isNaN(hours) || hours <= 0) {
      setError('Please enter a valid, positive number for allocated hours.');
      return;
    }
    if ((isSubProject || editingProject?.parentId) && (isNaN(weightValue) || weightValue <= 0 || weightValue > 100)) {
      setError('Please enter a valid weight between 1 and 100.');
      return;
    }

    let projectUsers: ProjectUser[] | undefined;
    let finalFrequency: ProjectFrequency | undefined;
    let finalFrequencyDetail: string | undefined;
    let savedHours: number | undefined;

    if (isTechnicalProject) {
      if (beneficiaries.length === 0) {
        setError('Please select at least one beneficiary team or user for this technical project.');
        return;
      }
      const parsedSavedHoursPerPerson = parseFloat(expectedSavedHoursPerPerson);
      if (isNaN(parsedSavedHoursPerPerson) || parsedSavedHoursPerPerson <= 0) {
        setError('Please enter a valid, positive number for expected saved hours.');
        return;
      }

      projectUsers = beneficiaries;
      finalFrequency = frequency;
      savedHours = totalExpectedSavedHours;

      switch(frequency) {
        case ProjectFrequency.Weekly:
        case ProjectFrequency.Monthly:
        case ProjectFrequency.ThreeWeeksOnce:
          finalFrequencyDetail = frequencyDetail;
          break;
        case ProjectFrequency.TwiceAMonth:
          finalFrequencyDetail = `${twiceAMonthDate1},${twiceAMonthDate2}`;
          break;
        case ProjectFrequency.SpecificDates:
          if (specificDates.length === 0) {
            setError('Please add at least one specific date.');
            return;
          }
          finalFrequencyDetail = JSON.stringify(specificDates.sort());
          break;
      }
    }

    if (!teamId || isNaN(Number(teamId)) || Number(teamId) <= 0) {
      setError('A team must be selected.');
      return;
    }
    const projectData = {
      name: name.trim(),
      allocatedHours: hours,
      leadId,
      team_id: Number(teamId),
      parentId: parentId || undefined,
      weight: isSubProject ? weightValue : undefined,
      users: projectUsers,
      frequency: finalFrequency,
      frequencyDetail: finalFrequencyDetail,
      expectedSavedHours: savedHours,
      description: description.trim(),
      end_date: endDate.trim(),
      beneficiary: beneficiary.trim(),
    };
    console.log('DEBUG: team_id value:', teamId, 'typeof:', typeof teamId);
    console.log('DEBUG: projectData payload:', projectData);

    try {
      if (isEditMode && editingProject) {
        const updates: Partial<Omit<Project, 'id'>> = projectData;
        await onUpdateProject(editingProject.id, updates);
        onClose();
      } else {
        await onAddProject(projectData);
        onClose();
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project. Please try again.');
    }
  }, [
    allocatedHours,
    beneficiary,
    beneficiaries,
    description,
    editingProject,
    endDate,
    expectedSavedHoursPerPerson,
    frequency,
    frequencyDetail,
    isEditMode,
    isSubProject,
    leadId,
    name,
    onAddProject,
    onUpdateProject,
    parentId,
    specificDates,
    totalExpectedSavedHours,
    twiceAMonthDate1,
    twiceAMonthDate2,
    weight,
  ]);

  const handleBeneficiarySelection = useCallback((type: 'user' | 'team', id: string) => {
    setBeneficiaries(prev => {
      const isSelected = prev.some(u => u.type === type && u.id === id);
      if (isSelected) {
        return prev.filter(u => !(u.type === type && u.id === id));
      } else {
        return [...prev, { type, id }];
      }
    });
  }, []);

  const beneficiaryDisplay = useMemo(() => {
    if (beneficiaries.length === 0) return 'Select beneficiaries...';
    return beneficiaries.map(u => {
      if (u.type === 'user') return teamMembers.find(tm => tm.id === u.id)?.name;
      return `[T] ${teams.find(t => t.id === u.id)?.name}`;
    }).filter(Boolean).join(', ');
  }, [beneficiaries, teamMembers, teams]);

  const modalTitle = isEditMode ? `Edit Project: ${editingProject?.name}` : (isSubProject ? "Add New Sub-Project" : "Add New Project");

  const inputStyles = "block w-full rounded-md bg-light-bg dark:bg-dark-input border border-light-border dark:border-dark-border focus:border-white shadow-sm focus:outline-none focus:ring-0 sm:text-sm p-2.5 placeholder:text-light-text-secondary/50 dark:placeholder:text-dark-text-secondary/50 transition-colors duration-150";
  const customSelectorStyles = "text-left flex justify-between items-center";

  const renderFrequencyDetails = useCallback(() => {
    switch(frequency) {
      case ProjectFrequency.Weekly:
      case ProjectFrequency.ThreeWeeksOnce:
        return (
          <select 
            value={frequencyDetail} 
            onChange={(e) => setFrequencyDetail(e.target.value)} 
            className={inputStyles}
          >
            {weekDays.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        );
      case ProjectFrequency.Monthly:
        return (
          <select 
            value={frequencyDetail} 
            onChange={(e) => setFrequencyDetail(e.target.value)} 
            className={inputStyles}
          >
            {monthDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        );
      case ProjectFrequency.TwiceAMonth:
        return (
          <div className="flex gap-4">
            <select 
              value={twiceAMonthDate1} 
              onChange={(e) => setTwiceAMonthDate1(e.target.value)} 
              className={inputStyles}
            >
              {monthDates.map(date => (
                <option key={`d1-${date}`} value={date}>{date}</option>
              ))}
            </select>
            <select 
              value={twiceAMonthDate2} 
              onChange={(e) => setTwiceAMonthDate2(e.target.value)} 
              className={inputStyles}
            >
              {monthDates.map(date => (
                <option key={`d2-${date}`} value={date}>{date}</option>
              ))}
            </select>
          </div>
        );
      case ProjectFrequency.SpecificDates:
        return (
          <div>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={currentSpecificDate} 
                onChange={handleCurrentSpecificDateChange} 
                onFocus={() => handleInputFocus('currentSpecificDate')}
                onBlur={() => handleInputBlur('currentSpecificDate')}
                ref={(el) => (inputRefs.current.currentSpecificDate = el)}
                className={inputStyles} 
              />
              <Button 
                type="button" 
                onClick={() => {
                  if (currentSpecificDate) {
                    setSpecificDates(prev => [...prev, currentSpecificDate].sort());
                    setCurrentSpecificDate('');
                  }
                }} 
                variant="secondary"
              >
                Add
              </Button>
            </div>
            {specificDates.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 p-2 bg-light-bg dark:bg-dark-bg/50 rounded-md">
                {specificDates.map(date => (
                  <div 
                    key={date} 
                    className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full"
                  >
                    <span>{date}</span>
                    <button 
                      type="button" 
                      onClick={() => setSpecificDates(p => p.filter(d => d !== date))} 
                      className="p-0.5 rounded-full hover:bg-black/10"
                    >
                      <Icon name="close" className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [frequency, frequencyDetail, twiceAMonthDate1, twiceAMonthDate2, currentSpecificDate, specificDates, handleCurrentSpecificDateChange, handleInputFocus, handleInputBlur]);

  const FormField: React.FC<{ label: string; children: React.ReactNode; className?: string}> = ({ label, children, className }) => (
    <div className={className}>
      <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Project Lead">
          <div className="relative" ref={leadSelectorRef}>
            <button 
              type="button" 
              onClick={() => setIsLeadSelectorOpen(p => !p)} 
              className={`${inputStyles} ${customSelectorStyles}`}
            > 
              <span className={leadId ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-light-text-secondary/70 dark:text-dark-text-secondary/70'}>
                {leadId ? potentialLeads.find(m => m.id === leadId)?.name : 'Select a lead'}
              </span>
              <Icon 
                name={isLeadSelectorOpen ? 'chevron-up' : 'chevron-down'} 
                className={`h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary`} 
              />
            </button>
            {isLeadSelectorOpen && (
              <div className="absolute z-20 mt-1 w-full bg-light-card dark:bg-dark-input rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border">
                <ul className="max-h-60 overflow-y-auto p-1">
                  {potentialLeads.map(member => (
                    <li
                      key={member.id}
                      onClick={() => {
                        setLeadId(member.id);
                        setIsLeadSelectorOpen(false);
                      }}
                      className={`p-2 rounded text-sm cursor-pointer ${leadId === member.id ? 'bg-blue-500 text-white' : 'text-light-text-primary dark:text-dark-text-primary hover:bg-blue-500/20'}`}
                    >
                      {member.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Project Name">
            <input 
              type="text" 
              value={name} 
              onChange={handleNameChange} 
              onFocus={() => handleInputFocus('name')}
              onBlur={() => handleInputBlur('name')}
              ref={(el) => (inputRefs.current.name = el)}
              className={inputStyles} 
              placeholder="e.g., Quantum Leap Initiative" 
              required 
            />
          </FormField>
          <FormField label="Allocated Hours">
            <input
              type="number"
              value={allocatedHours}
              onChange={handleAllocatedHoursChange}
              onFocus={() => handleInputFocus('allocatedHours')}
              onBlur={() => handleInputBlur('allocatedHours')}
              ref={(el) => (inputRefs.current.allocatedHours = el)}
              className={inputStyles}
              placeholder="e.g., 500"
              min="1"
              required
            />
          </FormField>
          <FormField label="Team">
            <select
              value={teamId}
              onChange={e => {
                setTeamId(e.target.value);
              }}
              onFocus={() => handleInputFocus('teamId')}
              onBlur={() => handleInputBlur('teamId')}
              ref={el => (inputRefs.current.teamId = el)}
              className={inputStyles}
              required
            >
              <option value="" disabled>Select a team</option>
              {teams.map(team => (
                <option key={team.id} value={String(team.id)}>{team.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Project Description">
          <textarea 
            value={description} 
            onChange={handleDescriptionChange} 
            onFocus={() => handleInputFocus('description')}
            onBlur={() => handleInputBlur('description')}
            ref={(el) => (inputRefs.current.description = el)}
            className={inputStyles} 
            placeholder="Describe the project..." 
            required 
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="End Date">
            <input 
              type="date" 
              value={endDate} 
              onChange={handleEndDateChange} 
              onFocus={() => handleInputFocus('endDate')}
              onBlur={() => handleInputBlur('endDate')}
              ref={(el) => (inputRefs.current.endDate = el)}
              className={inputStyles} 
              required 
            />
          </FormField>
          <FormField label="Beneficiary">
            <input 
              type="text" 
              value={beneficiary} 
              onChange={handleBeneficiaryChange} 
              onFocus={() => handleInputFocus('beneficiary')}
              onBlur={() => handleInputBlur('beneficiary')}
              ref={(el) => (inputRefs.current.beneficiary = el)}
              className={inputStyles} 
              placeholder="e.g., Client Name or Team" 
              required 
            />
          </FormField>
        </div>

        {(isSubProject || editingProject?.parentId) && (
          <FormField label="Weight (%)">
            <input 
              type="number" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              onFocus={() => handleInputFocus('weight')}
              onBlur={() => handleInputBlur('weight')}
              ref={(el) => (inputRefs.current.weight = el)}
              className={inputStyles} 
              placeholder="e.g., 25" 
              min="1" 
              max="100" 
              required={isSubProject || !!editingProject?.parentId} 
            />
          </FormField>
        )}

        {isTechnicalProject && (
          <div className="space-y-6 pt-6 border-t-2 border-dashed border-light-border dark:border-dark-border">
            <h4 className="font-semibold text-brand-secondary flex items-center gap-2">
              <Icon name="bolt" className="h-5 w-5" />
              Technical Project Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <FormField label="Beneficiaries">
                <div className="relative" ref={beneficiaryRef}>
                  <button 
                    type="button" 
                    onClick={() => setIsBeneficiarySelectorOpen(p => !p)} 
                    className={`${inputStyles} ${customSelectorStyles} truncate`}
                  >
                    <span className={beneficiaries.length > 0 ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-light-text-secondary/70 dark:text-dark-text-secondary/70'}>
                      {beneficiaryDisplay}
                    </span>
                    <Icon 
                      name={isBeneficiarySelectorOpen ? 'chevron-up' : 'chevron-down'} 
                      className={`h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary`} 
                    />
                  </button>
                  {isBeneficiarySelectorOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-light-card dark:bg-dark-card rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border">
                      <style>{`
                        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4b5563; border-radius: 4px; border: 2px solid #1f2937; }
                      `}</style>
                      <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        <p className="px-2 pt-1 text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase">Teams</p>
                        {teams.map(team => {
                          const isSelected = beneficiaries.some(u => u.type === 'team' && u.id === team.id);
                          return (
                            <label 
                              key={`team-${team.id}`} 
                              className={`flex items-center gap-3 p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border/50 cursor-pointer ${isSelected ? 'bg-blue-500/20 dark:bg-slate-700' : ''}`}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => handleBeneficiarySelection('team', team.id)} 
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 bg-light-bg dark:bg-dark-input text-brand-primary focus:ring-brand-secondary" 
                              />
                              <Icon name="users" className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary" />
                              <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{team.name}</span>
                            </label>
                          )
                        })}
                        <p className="px-2 pt-2 text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase border-t border-light-border dark:border-dark-border mt-2">Users</p>
                        {teamMembers.map(member => {
                          const isSelected = beneficiaries.some(u => u.type === 'user' && u.id === member.id);
                          return (
                            <label 
                              key={`user-${member.id}`} 
                              className={`flex items-center gap-3 p-2 rounded-md hover:bg-light-border dark:hover:bg-dark-border/50 cursor-pointer ${isSelected ? 'bg-blue-500/20 dark:bg-slate-700' : ''}`}
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => handleBeneficiarySelection('user', member.id)} 
                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-500 bg-light-bg dark:bg-dark-input text-brand-primary focus:ring-brand-secondary" 
                              />
                              <img src={member.avatarUrl} alt={member.name} className="h-6 w-6 rounded-full" />
                              <span className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">{member.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </FormField>
              <FormField label="Expected Saved Hours (per person)">
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={expectedSavedHoursPerPerson} 
                    onChange={handleExpectedSavedHoursChange} 
                    onFocus={() => handleInputFocus('expectedSavedHoursPerPerson')}
                    onBlur={() => handleInputBlur('expectedSavedHoursPerPerson')}
                    ref={(el) => (inputRefs.current.expectedSavedHoursPerPerson = el)}
                    className={inputStyles} 
                    placeholder="e.g., 5" 
                    min="0.1" 
                    step="0.1" 
                    required 
                  />
                  <div className="text-sm text-center flex-shrink-0 w-24">
                    <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">Total: {totalExpectedSavedHours.toFixed(1)}h</span>
                    <span className="text-xs block text-light-text-secondary dark:text-dark-text-secondary">({beneficiaryCount} people)</span>
                  </div>
                </div>
              </FormField>
              <FormField label="Frequency" className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="relative" ref={frequencySelectorRef}>
                    <button 
                      type="button" 
                      onClick={() => setIsFrequencySelectorOpen(p => !p)} 
                      className={`${inputStyles} ${customSelectorStyles}`}
                    >
                      <span>{frequency}</span>
                      <Icon 
                        name={isFrequencySelectorOpen ? 'chevron-up' : 'chevron-down'} 
                        className={`h-4 w-4 text-light-text-secondary dark:text-dark-text-secondary`} 
                      />
                    </button>
                    {isFrequencySelectorOpen && (
                      <div className="absolute z-20 mt-1 w-full bg-light-card dark:bg-dark-input rounded-md shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-dark-border">
                        <ul className="max-h-60 overflow-y-auto p-1">
                          {Object.values(ProjectFrequency).map(freq => (
                            <li
                              key={freq}
                              onClick={() => {
                                setFrequency(freq);
                                setIsFrequencySelectorOpen(false);
                              }}
                              className={`p-2 rounded text-sm cursor-pointer ${frequency === freq ? 'bg-blue-500 text-white' : 'text-light-text-primary dark:text-dark-text-primary hover:bg-blue-500/20'}`}
                            >
                              {freq}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="w-full">{renderFrequencyDetails()}</div>
                </div>
              </FormField>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {isEditMode ? "Save Changes" : (isSubProject ? "Add Sub-Project" : "Add Project")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Custom comparison for React.memo to prevent unnecessary re-renders
const arePropsEqual = (prevProps: AddProjectModalProps, nextProps: AddProjectModalProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.parentId === nextProps.parentId &&
    prevProps.editingProject === nextProps.editingProject &&
    prevProps.teamMembers === nextProps.teamMembers &&
    prevProps.teams === nextProps.teams &&
    prevProps.onClose === nextProps.onClose &&
    prevProps.onAddProject === nextProps.onAddProject &&
    prevProps.onUpdateProject === nextProps.onUpdateProject
  );
};

export default React.memo(AddProjectModal, arePropsEqual);