export type Status = 'todo' | 'in-progress' | 'in-review' | 'done';
export type Priority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  settings?: Record<string, unknown>;
}

export interface Space {
  _id: string;
  name: string;
  key: string;
  templateType: string;
  accessType: string;
  team?: DirectoryItem | string | null;
}

export interface WorkItem {
  _id: string;
  key: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  type: 'task' | 'story' | 'epic' | 'subtask' | 'bug';
  space: Space | string;
  assignee?: User;
  reporter?: User;
  labels: string[];
  components?: string[];
  versions?: string[];
  checklist?: { text: string; done: boolean }[];
  storyPoints?: number;
  votes?: number;
  dueDate?: string;
  flagged?: boolean;
  startDate?: string;
  endDate?: string;
  comments?: { _id?: string; body: string; author?: User; createdAt?: string }[];
  history?: { field: string; from?: unknown; to?: unknown; actor?: User; createdAt?: string }[];
  workLogs?: { minutes: number; note?: string; author?: User; loggedAt?: string; createdAt?: string }[];
  watchers?: User[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Sprint {
  _id: string;
  name: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
}

export interface DirectoryItem {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  owner?: string;
  team?: string;
  goal?: string;
  members?: { user?: User; role?: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Invite {
  _id: string;
  email: string;
  team?: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt?: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  readAt?: string;
  createdAt?: string;
}
