import React, { useState, useEffect } from 'react';
import { Project, ProjectFrequency } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { Icon } from './ui/Icon';

interface CompleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onComplete: (data: { savedHours: number, frequency: ProjectFrequency, frequencyDetail?: string }) => void;
}

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthDates = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const CompleteProjectModal: React.FC<CompleteProjectModalProps> = ({ isOpen, onClose, project, onComplete }) => {
  const [savedHours, setSavedHours] = useState('0');
  const [frequency, setFrequency] = useState<ProjectFrequency>(ProjectFrequency.Daily);
  const [error, setError] = useState('');
  
  // State for different frequency details
  const [frequencyDetail, setFrequencyDetail] = useState(''); // For single-value details
  const [twiceAMonthDate1, setTwiceAMonthDate1] = useState('1');
  const [twiceAMonthDate2, setTwiceAMonthDate2] = useState('15');
  const [specificDates, setSpecificDates] = useState<string[]>([]);
  const [currentSpecificDate, setCurrentSpecificDate] = useState('');

  useEffect(() => {
    if (isOpen && project) {
      setSavedHours(project.savedHours?.toString() || '0');
      const initialFreq = project.frequency || ProjectFrequency.Daily;
      setFrequency(initialFreq);
      const detail = project.frequencyDetail || '';
      
      // Reset all detail states
      setFrequencyDetail('');
      setTwiceAMonthDate1('1');
      setTwiceAMonthDate2('15');
      setSpecificDates([]);
      setCurrentSpecificDate('');
      setError('');

      // Populate correct state based on saved data
      switch(initialFreq) {
          case ProjectFrequency.TwiceAMonth:
              const [d1, d2] = detail.split(',');
              setTwiceAMonthDate1(d1 || '1');
              setTwiceAMonthDate2(d2 || '15');
              break;
          case ProjectFrequency.SpecificDates:
              try {
                  const dates = JSON.parse(detail);
                  if (Array.isArray(dates)) setSpecificDates(dates);
              } catch { /* Ignore parsing errors */ }
              break;
          case ProjectFrequency.Weekly:
          case ProjectFrequency.ThreeWeeksOnce:
              setFrequencyDetail(detail || weekDays[0]);
              break;
          case ProjectFrequency.Monthly:
              setFrequencyDetail(detail || monthDates[0]);
              break;
      }
    }
  }, [isOpen, project]);
  
  // Set default details when frequency changes
  useEffect(() => {
      if (!isOpen) return;
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
  }, [frequency, isOpen]);

  const handleAddSpecificDate = () => {
      if (currentSpecificDate && !specificDates.includes(currentSpecificDate)) {
          setSpecificDates(prev => [...prev, currentSpecificDate].sort());
          setCurrentSpecificDate('');
      }
  };

  const handleRemoveSpecificDate = (dateToRemove: string) => {
      setSpecificDates(prev => prev.filter(d => d !== dateToRemove));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const hours = parseFloat(savedHours);
    if (isNaN(hours)) {
      setError('Please enter a valid number for Saved Hours.');
      return;
    }

    let finalFrequencyDetail: string | undefined;

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

    onComplete({
      savedHours: hours,
      frequency: frequency,
      frequencyDetail: finalFrequencyDetail,
    });
  };
  
  const inputStyles = "block w-full rounded-md bg-light-bg dark:bg-dark-input border-light-border dark:border-dark-border shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 dark:text-dark-text-primary";

  const renderFrequencyDetails = () => {
      switch(frequency) {
          case ProjectFrequency.Weekly:
          case ProjectFrequency.ThreeWeeksOnce:
              return (
                 <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Day of Week</label>
                    <select value={frequencyDetail} onChange={(e) => setFrequencyDetail(e.target.value)} className={`mt-1 ${inputStyles}`}>
                        {weekDays.map(day => <option key={day} value={day}>{day}</option>)}
                    </select>
                 </div>
              );
          case ProjectFrequency.Monthly:
               return (
                 <div>
                    <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Date of Month</label>
                    <select value={frequencyDetail} onChange={(e) => setFrequencyDetail(e.target.value)} className={`mt-1 ${inputStyles}`}>
                        {monthDates.map(date => <option key={date} value={date}>{date}</option>)}
                    </select>
                 </div>
              );
          case ProjectFrequency.TwiceAMonth:
              return (
                  <>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">First Date</label>
                        <select value={twiceAMonthDate1} onChange={(e) => setTwiceAMonthDate1(e.target.value)} className={`mt-1 ${inputStyles}`}>
                            {monthDates.map(date => <option key={`d1-${date}`} value={date}>{date}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Second Date</label>
                        <select value={twiceAMonthDate2} onChange={(e) => setTwiceAMonthDate2(e.target.value)} className={`mt-1 ${inputStyles}`}>
                            {monthDates.map(date => <option key={`d2-${date}`} value={date}>{date}</option>)}
                        </select>
                    </div>
                  </>
              );
          case ProjectFrequency.SpecificDates:
              return (
                  <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Add Specific Dates</label>
                      <div className="mt-1 flex items-center gap-2">
                          <input type="date" value={currentSpecificDate} onChange={(e) => setCurrentSpecificDate(e.target.value)} className={inputStyles} />
                          <Button type="button" onClick={handleAddSpecificDate} variant="secondary">Add</Button>
                      </div>
                      {specificDates.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2 p-2 bg-light-bg dark:bg-dark-bg/50 rounded-md">
                              {specificDates.map(date => (
                                  <div key={date} className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium px-2 py-1 rounded-full">
                                      <span>{date}</span>
                                      <button type="button" onClick={() => handleRemoveSpecificDate(date)} className="p-0.5 rounded-full hover:bg-black/10">
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
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Complete Project: ${project.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Log the final metrics for this project to mark it as completed.
        </p>

        <div>
          <label htmlFor="savedHours" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
            Total Saved Hours
          </label>
          <div className="mt-1">
            <input
              type="number"
              id="savedHours"
              value={savedHours}
              onChange={(e) => setSavedHours(e.target.value)}
              className={inputStyles}
              placeholder="e.g., 40"
              step="0.1"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">
                    Frequency
                </label>
                <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as ProjectFrequency)}
                    className={`mt-1 ${inputStyles}`}
                >
                    {Object.values(ProjectFrequency).map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                    ))}
                </select>
            </div>
            {renderFrequencyDetails()}
        </div>


        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="pt-4 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Complete Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CompleteProjectModal;