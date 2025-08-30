import { GoogleGenAI, Type } from "@google/genai";
import { TaskPriority, TeamMember, Project, Task, TaskStatus } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
