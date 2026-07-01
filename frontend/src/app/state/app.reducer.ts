import { createReducer, on, createAction, props } from '@ngrx/store';
import { Space, WorkItem } from '../core/models';

export type Theme = 'light' | 'dark';

export interface AppState {
  spaces: Space[];
  workItems: WorkItem[];
  sidebarCollapsed: boolean;
  theme: Theme;
}

export const initialState: AppState = {
  spaces: [],
  workItems: [],
  sidebarCollapsed: false,
  theme: 'dark'
};

export const setSpaces = createAction('[AURA] Set Spaces', props<{ spaces: Space[] }>());
export const setWorkItems = createAction('[AURA] Set Work Items', props<{ workItems: WorkItem[] }>());
export const toggleSidebar = createAction('[AURA] Toggle Sidebar');
export const toggleTheme = createAction('[AURA] Toggle Theme');

export const appReducer = createReducer(
  initialState,
  on(setSpaces, (state, { spaces }) => ({ ...state, spaces })),
  on(setWorkItems, (state, { workItems }) => ({ ...state, workItems })),
  on(toggleSidebar, (state) => ({ ...state, sidebarCollapsed: !state.sidebarCollapsed })),
  on(toggleTheme, (state) => {
    const theme: Theme = state.theme === 'dark' ? 'light' : 'dark';
    return { ...state, theme };
  })
);