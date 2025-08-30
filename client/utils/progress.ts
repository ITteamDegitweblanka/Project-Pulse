

import { Project, Task, ProjectStatus, TaskStatus } from '../types';

/**
 * Calculates the progress of a project.
 * - If the project is 'Not Started', progress is 0%.
 * - If the project is a parent (has sub-projects), progress is the sum of the weights of its 'Completed' sub-projects.
 * - If the project is a leaf (no sub-projects), progress is based on the completion of its own tasks.
 * - If any project's status is 'Completed', its progress is 100%.
 * @param proj The project to calculate progress for.
 * @param allProjects The list of all projects in the system.
 * @param allTasks The list of all tasks.
 * @param cache A Map to cache results for performance.
 * @returns The calculated progress percentage (0-100).
 */
export const calculateProjectProgress = (
    proj: Project,
    allProjects: Project[],
    allTasks: Task[],
    cache: Map<string, number>
): number => {
    if (cache.has(proj.id)) {
        return cache.get(proj.id)!;
    }

    // A project explicitly marked as 'Completed' is always 100% done.
    if (proj.status === ProjectStatus.Completed) {
        cache.set(proj.id, 100);
        return 100;
    }
    
    // A project explicitly marked as 'Not Started' is always 0% done.
    if (proj.status === ProjectStatus.NotStarted) {
        cache.set(proj.id, 0);
        return 0;
    }

    const children = allProjects.filter(p => p.parentId === proj.id);
    let progress: number;

    if (children.length > 0) {
        // It's a parent project. Progress is the sum of weights of completed children.
        progress = children
            .filter(child => child.status === ProjectStatus.Completed)
            .reduce((sum, child) => sum + (child.weight || 0), 0);
    } else {
        // It's a leaf project. Progress is based on its own tasks.
        const relevantTasks = allTasks.filter(task => task.projectId === proj.id);

        if (relevantTasks.length === 0) {
            // No tasks, progress is 0 (unless already 'Completed', which is handled above).
            progress = 0;
        } else {
            const completedTasks = relevantTasks.filter(
                task => task.status === TaskStatus.Completed
            ).length;
            progress = Math.round((completedTasks / relevantTasks.length) * 100);
        }
    }
    
    // Ensure progress doesn't exceed 100, just in case weights sum up to > 100
    progress = Math.min(progress, 100);

    cache.set(proj.id, progress);
    return progress;
};