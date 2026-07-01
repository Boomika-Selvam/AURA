import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DirectoryItem, Invite, Notification, Space, Sprint, User, WorkItem } from './models';

const API = 'http://localhost:5000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  login(body: { email: string; password: string }) {
    return this.http.post<{ user: User; accessToken: string; refreshToken: string }>(`${API}/auth/login`, body);
  }

  register(body: Record<string, unknown>) {
    return this.http.post<{ user: User; accessToken: string; refreshToken: string }>(`${API}/auth/register`, body);
  }

  getCurrentUser() {
    return this.http.get<{ user: User }>(`${API}/auth/me`);
  }

  listUsers() {
    return this.http.get<User[]>(`${API}/auth/users`);
  }

  listSpaces(): Observable<Space[]> {
    return this.http.get<Space[]>(`${API}/spaces`);
  }

  createSpace(body: Partial<Space>) {
    return this.http.post<Space>(`${API}/spaces`, body);
  }

  listWorkItems(params: Record<string, string> = {}) {
    return this.http.get<WorkItem[]>(`${API}/work-items`, { params });
  }

  createWorkItem(body: Record<string, unknown>) {
    return this.http.post<WorkItem>(`${API}/work-items`, body);
  }

  moveWorkItem(id: string, status: string, order = 0) {
    return this.http.patch<WorkItem>(`${API}/work-items/${id}/move`, { status, order });
  }

  updateWorkItem(id: string, body: Record<string, unknown>) {
    return this.http.put<WorkItem>(`${API}/work-items/${id}`, body);
  }

  deleteWorkItem(id: string) {
    return this.http.delete<void>(`${API}/work-items/${id}`);
  }

  addComment(id: string, body: string) {
    return this.http.post<WorkItem>(`${API}/work-items/${id}/comments`, { body });
  }

  addWorkLog(id: string, minutes: number, note = '') {
    return this.http.post(`${API}/work-items/${id}/work-logs`, { minutes, note });
  }

  toggleWatcher(id: string) {
    return this.http.post<WorkItem>(`${API}/work-items/${id}/watch`, {});
  }

  listSprints(space?: string) {
    return this.http.get<Sprint[]>(`${API}/sprints`, { params: space ? { space } : {} });
  }

  createSprint(body: Record<string, unknown>) {
    return this.http.post<Sprint>(`${API}/sprints`, body);
  }

  startSprint(id: string) {
    return this.http.post<Sprint>(`${API}/sprints/${id}/start`, {});
  }

  completeSprint(id: string) {
    return this.http.post<Sprint>(`${API}/sprints/${id}/complete`, {});
  }

  listDirectory(resource: string) {
    return this.http.get<DirectoryItem[]>(`${API}/${resource}`);
  }
  createDirectory(resource: string, body: any) {
    return this.http.post<DirectoryItem>(`${API}/${resource}`, body);
  }
  getDirectoryItem(resource: string, id: string) {
    return this.http.get<DirectoryItem>(`${API}/${resource}/${id}`);
  }
  updateDirectory(resource: string, id: string, body: any) {
    return this.http.put<DirectoryItem>(`${API}/${resource}/${id}`, body);
  }
  deleteDirectory(resource: string, id: string) {
    return this.http.delete(`${API}/${resource}/${id}`);
  }

  // Invites
  sendInvite(body: { email: string; teamId?: string }) {
    return this.http.post<{ invite: Invite; delivered: boolean; devLink?: string }>(`${API}/invites`, body);
  }
  listInvites(teamId?: string) {
    return this.http.get<Invite[]>(`${API}/invites`, { params: teamId ? { team: teamId } : {} });
  }
  getInvite(token: string) {
    return this.http.get<{ email: string; team: { id: string; name: string } | null; invitedBy?: string; hasAccount: boolean }>(`${API}/invites/${token}`);
  }
  acceptInvite(token: string, body: { name?: string; password: string }) {
    return this.http.post<{ user: User; accessToken: string; refreshToken: string }>(`${API}/invites/${token}/accept`, body);
  }

  // Notifications
  listNotifications() {
    return this.http.get<Notification[]>(`${API}/notifications`);
  }
  markNotificationRead(id: string) {
    return this.http.post<Notification>(`${API}/notifications/${id}/read`, {});
  }
}
