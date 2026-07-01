import { CdkDragDrop, DragDropModule, transferArrayItem } from '@angular/cdk/drag-drop';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './core/api.service';
import { DirectoryItem, Invite, Notification, Space, Sprint, Status, User, WorkItem } from './core/models';
import { RealtimeService } from './core/realtime.service';

const columns: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review', label: 'In Review' },
  { id: 'done', label: 'Done' }
];

@Component({
  selector: 'aura-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DatePipe],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()" [class.light-theme]="theme() === 'light'">
      <aside class="sidebar">
        <div class="sidebar-head"><strong>AURA</strong><button title="Toggle sidebar" (click)="sidebarCollapsed.set(!sidebarCollapsed())">Menu</button></div>
        <nav>
          <section *ngFor="let group of navGroups">
            <span>{{ group.title }}</span>
            <button
  *ngFor="let item of group.items"
  [class.active]="view() === item.view && (!item.filter || selectedFilter() === item.filter)"
  (click)="changeView(item.view, item.filter)">
  {{ item.label }}
</button>
          </section>
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <button title="Toggle sidebar" (click)="sidebarCollapsed.set(!sidebarCollapsed())">Menu</button>
          <button class="search" (click)="searchOpen.set(true)">Search AURA <kbd>Ctrl K</kbd></button>
          <button (click)="openCreateWorkItem()">+ Create</button>
          <button title="Notifications" (click)="view.set('notifications')">N<span *ngIf="unreadCount()">{{ unreadCount() }}</span></button>
          <button title="Theme" (click)="theme.set(theme() === 'dark' ? 'light' : 'dark')">T</button>
          <button title="Profile" (click)="profileOpen.set(!profileOpen())">AB</button>
          <div class="profile-menu" *ngIf="profileOpen()">
            <button (click)="view.set('settings')">Account Settings</button>
            <button (click)="theme.set('light')">Light Theme</button>
            <button (click)="theme.set('dark')">Dark Theme</button>
            <button (click)="logout()">Logout</button>
          </div>
        </header>

        <div class="load-error-banner" *ngIf="loadError()">
          ⚠ {{ loadError() }}
          <button class="ghost" (click)="load()">Retry</button>
        </div>

        <section class="content">
          <ng-container [ngSwitch]="view()">
            <section *ngSwitchCase="'home'" class="home-grid">
              <article class="hero">
                <h1>Good morning, build momentum.</h1>
                <p>Your recommended spaces, assigned work, starred items, recent views, and sprint signals are gathered here.</p>
              </article>
              <article class="panel">
                <h2>Recommended Spaces</h2>
                <div class="space-list">
                  <button *ngFor="let space of spaces()" (click)="selectSpace(space)"><strong>{{ space.key }}</strong>{{ space.name }}</button>
                  <button class="ghost" (click)="openCreateSpace()">+ Create space</button>
                </div>
              </article>
              <article class="panel feed">
                <h2>For You</h2>
                <div class="tabs"><button *ngFor="let tab of feedTabs" [class.active]="feedTab() === tab" (click)="feedTab.set(tab)">{{ tab }}</button></div>
                <div class="feed-row" *ngFor="let item of workItems() | slice:0:6">
                  <strong>{{ item.key }}</strong><span>{{ item.title }}</span><small>{{ item.updatedAt | date:'short' }}</small>
                </div>
              </article>
            </section>

            <section *ngSwitchCase="'board'" class="board-view">
              <div class="view-head"><h1>{{ selectedSpace()?.name || 'Board' }}</h1><input [(ngModel)]="query" placeholder="Filter board" /></div>
              <div class="board" cdkDropListGroup>
                <div class="column" *ngFor="let column of columns" cdkDropList [cdkDropListData]="itemsByStatus(column.id)" (cdkDropListDropped)="drop($event, column.id)">
                  <h2>{{ column.label }} <span>{{ itemsByStatus(column.id).length }}</span></h2>
                  <article class="task-card" *ngFor="let task of itemsByStatus(column.id)" cdkDrag (click)="openDetailPanel(task)">
                    <div><strong>{{ task.key }}</strong><span class="priority {{ task.priority }}">{{ task.priority }}</span></div>
                    <p>{{ task.title }}</p>
                    <footer><span>{{ task.type }}</span><span>{{ task.assignee?.name || 'Unassigned' }}</span></footer>
                  </article>
                  <button class="ghost" (click)="openCreateWorkItem(column.id)">+ Create task</button>
                </div>
              </div>
            </section>

            <section *ngSwitchCase="'backlog'" class="two-pane">
              <article class="panel">
                <h2>Active Sprint</h2>
                <div class="feed-row" *ngFor="let task of sprintItems()"><strong>{{ task.key }}</strong><span>{{ task.title }}</span><small>{{ task.storyPoints || 0 }} pts</small></div>
                <p class="muted" *ngIf="!activeSprint()">No active sprint yet. Create or start one to plan delivery.</p>
                <button (click)="createSprint()">Create Sprint</button>
                <button [disabled]="!nextSprint()" (click)="startSprint()">Start Sprint</button>
                <button [disabled]="!activeSprint()" (click)="completeSprint()">Complete Sprint</button>
              </article>
              <article class="panel"><h2>Backlog</h2><div class="feed-row" *ngFor="let task of backlogItems()"><strong>{{ task.key }}</strong><span>{{ task.title }}</span></div><button class="ghost" (click)="openCreateWorkItem()">+ Create backlog item</button></article>
            </section>

            <section *ngSwitchCase="'timeline'" class="timeline-view">
              <div class="view-head">
                <div style="display:flex;align-items:center;gap:16px">
                  <h1 style="margin:0">Timeline</h1>
                  <div class="tl-legend">
                    <span class="tl-dot todo"></span>To Do
                    <span class="tl-dot in-progress"></span>In Progress
                    <span class="tl-dot in-review"></span>In Review
                    <span class="tl-dot done"></span>Done
                  </div>
                </div>
                <button (click)="openCreateWorkItem()">+ Add item</button>
              </div>

              <!-- Month header -->
              <div class="gantt-wrap">
                <div class="gantt-labels-col">
                  <div class="gantt-header-cell">Work Item</div>
                  <div class="gantt-label-row" *ngFor="let task of workItems()" (click)="openDetailPanel(task)">
                    <span class="gantt-key">{{ task.key }}</span>
                    <span class="gantt-title-label">{{ task.title }}</span>
                    <span class="gantt-badge {{ task.status }}">{{ task.status }}</span>
                  </div>
                </div>

                <div class="gantt-chart-col" #ganttChart>
                  <!-- Month columns -->
                  <div class="gantt-months">
                    <div class="gantt-month" *ngFor="let m of ganttMonths()">{{ m.label }}</div>
                  </div>
                  <!-- Today line -->
                  <div class="gantt-today-line" [style.left.%]="todayPercent()"></div>
                  <!-- Bars -->
                  <div class="gantt-bar-row" *ngFor="let task of workItems()">
                    <div
                      class="gantt-bar {{ task.status }} {{ task.priority }}"
                      [style.left.%]="barLeft(task)"
                      [style.width.%]="barWidth(task)"
                      [title]="task.title + ' (' + task.status + ')'"
                      (click)="openDetailPanel(task)">
                      <span class="gantt-bar-label">{{ task.title }}</span>
                      <div class="gantt-bar-progress" [style.width.%]="progressFor(task)"></div>
                    </div>
                  </div>
                  <!-- Empty state -->
                  <div class="gantt-empty" *ngIf="workItems().length === 0">
                    <p>No work items yet. Add items with start and end dates to see them on the timeline.</p>
                    <button (click)="openCreateWorkItem()">+ Create first item</button>
                  </div>
                </div>
              </div>

              <!-- Summary footer -->
              <div class="gantt-footer">
                <span>{{ workItems().length }} items</span>
                <span>{{ itemsByStatus('done').length }} done</span>
                <span>{{ itemsByStatus('in-progress').length }} in progress</span>
                <span>Today: {{ ganttToday() }}</span>
              </div>
            </section>

            <section *ngSwitchCase="'filters'" class="directory">
              <div class="view-head">
                <div>
                  <h1>{{ filterTitle() }}</h1>
                  <p>{{ filteredWorkItems().length }} work item{{ filteredWorkItems().length === 1 ? '' : 's' }}</p>
                </div>
                <input [(ngModel)]="query" placeholder="Search filtered work items" />
              </div>
              <div class="directory-grid">
                <article class="panel clickable" *ngFor="let task of filteredWorkItems()" (click)="openDetailPanel(task)">
                  <h2>{{ task.key }} — {{ task.title }}</h2>
                  <p>Status: {{ task.status }} · Priority: {{ task.priority }}</p>
                  <p>Assignee: {{ task.assignee?.name || 'Unassigned' }}</p>
                  <small>Updated {{ task.updatedAt | date:'medium' }}</small>
                </article>
                <article class="panel" *ngIf="filteredWorkItems().length === 0">
                  <h2>No matching work items</h2>
                  <p>There is nothing in this filter yet.</p>
                </article>
              </div>
            </section>

            <section *ngSwitchCase="'notifications'" class="directory">
              <div class="view-head">
                <h1>Notifications</h1>
                <button (click)="markAllNotificationsRead()">Mark all read</button>
              </div>
              <div class="directory-grid">
                <article class="panel clickable" *ngFor="let item of notifications()" (click)="markNotificationRead(item)">
                  <h2>{{ item.title }}</h2>
                  <p>{{ item.body || item.type }}</p>
                  <small>{{ item.readAt ? 'Read' : 'Unread' }} · {{ item.createdAt | date:'medium' }}</small>
                </article>
                <article class="panel" *ngIf="notifications().length === 0">
                  <h2>No notifications</h2>
                  <p>Your mentions, assignments, sprint events, and issue updates will appear here.</p>
                </article>
              </div>
            </section>

            <section *ngSwitchDefault class="directory">
              <div class="view-head">
  <h1>{{ titleFor(view()) }}</h1>

  <button
    *ngIf="['plans','teams','goals','projects','dashboards'].includes(view())"
    (click)="createDirectoryItem()">
    Create
  </button>
</div>
              <div class="directory-grid">
                <article class="panel clickable" *ngFor="let item of directoryItems()" (click)="openDirectoryItem(item)">
                  <h2>{{ item.title || item.name }}</h2>
                  <p>Status: {{ item.status || 'active' }}</p>
                  <progress [value]="item.progress || 30" max="100"></progress>
                </article>
                <article class="panel settings-panel" *ngIf="view() === 'settings'">
                  <h2>Settings</h2>
                  <label>Timezone <input value="Asia/Calcutta" /></label>
                  <label>Language <input value="English" /></label>
                  <label><input type="checkbox" checked /> Auto watch work items</label>
                </article>
              </div>
            </section>

            <section *ngSwitchCase="'directory-detail'" class="directory-detail">
              <div class="view-head">
                <button class="back" (click)="back()">&larr; Back to {{ titleFor(selectedResource()) }}</button>
                <div style="display:flex;gap:8px">
                  <button *ngIf="selectedResource() === 'teams'" (click)="openInviteModal()">+ Invite people</button>
                  <button class="danger" (click)="deleteDirectoryItem()">Delete</button>
                </div>
              </div>
              <article class="panel detail-card" *ngIf="selectedDirectoryItem() as item">
                <label>Name
                  <input [(ngModel)]="detailName" placeholder="Untitled" />
                </label>
                <label>Description
                  <textarea rows="4" [(ngModel)]="detailDescription" placeholder="Add a description"></textarea>
                </label>
                <div class="detail-row">
                  <label>Status
                    <select [(ngModel)]="detailStatus">
                      <option *ngFor="let option of statusOptionsFor(selectedResource())" [value]="option">{{ option }}</option>
                    </select>
                  </label>
                  <label>Progress ({{ detailProgress }}%)
                    <input type="range" min="0" max="100" [(ngModel)]="detailProgress" />
                  </label>
                </div>
                <p class="error" *ngIf="detailError()">{{ detailError() }}</p>
                <footer>
                  <button class="ghost" (click)="back()">Cancel</button>
                  <button [disabled]="savingDetail()" (click)="saveDirectoryItem()">{{ savingDetail() ? 'Saving…' : 'Save changes' }}</button>
                </footer>
              </article>

              <article class="panel" *ngIf="selectedResource() === 'teams' && selectedDirectoryItem() as item">
                <h2>Members ({{ item.members?.length || 0 }})</h2>
                <div class="member-row" *ngFor="let m of item.members">
                  <span class="avatar-dot">{{ (m.user?.name || '?').charAt(0) }}</span>
                  <span>{{ m.user?.name || 'Unknown' }}</span>
                  <small>{{ m.user?.email }}</small>
                  <span class="role-tag">{{ m.role || 'member' }}</span>
                </div>
                <p *ngIf="!item.members?.length" class="muted">No members yet. Invite people to get this team started.</p>

                <h2 style="margin-top:18px">Pending invites</h2>
                <div class="member-row" *ngFor="let invite of pendingInvites()">
                  <span class="avatar-dot">&#64;</span>
                  <span>{{ invite.email }}</span>
                  <span class="role-tag">{{ invite.status }}</span>
                </div>
                <p *ngIf="!pendingInvites().length" class="muted">No pending invites.</p>
              </article>
            </section>
          </ng-container>
        </section>
      </main>

      <section class="modal-backdrop" *ngIf="searchOpen()" (click)="searchOpen.set(false)">
        <div class="command-modal" (click)="$event.stopPropagation()">
          <input autofocus [(ngModel)]="query" placeholder="Search projects, tasks, spaces, plans, filters, and people" />
          <button *ngFor="let task of filteredItems()" (click)="openDetailPanel(task); searchOpen.set(false)">{{ task.key }} - {{ task.title }}</button>
          <button *ngFor="let link of quickLinks"
(click)="changeView(link.view); searchOpen.set(false)">{{ link.label }}</button>
        </div>
      </section>

      <!-- Space Create Modal -->
      <section class="modal-backdrop" *ngIf="spaceModalOpen()" (click)="closeSpaceModal()">
        <div class="command-modal create-modal" (click)="$event.stopPropagation()">
          <h2>Create Space</h2>
          <label>Space Name *
            <input autofocus [(ngModel)]="spaceName" placeholder="e.g. Platform Team" (keyup.enter)="submitCreateSpace()" />
          </label>
          <label>Space Key *
            <input [(ngModel)]="spaceKey" placeholder="e.g. PLT" maxlength="6" style="text-transform:uppercase" />
          </label>
          <label>Description
            <textarea [(ngModel)]="spaceDescription" rows="3" placeholder="What does this space cover?"></textarea>
          </label>
          <label>Assign team (optional)
            <select [(ngModel)]="spaceTeamId">
              <option value="">No team</option>
              <option *ngFor="let team of teamsList()" [value]="team._id">{{ team.name }}</option>
            </select>
          </label>
          <div class="detail-row">
            <label>Template
              <select [(ngModel)]="spaceTemplate">
                <option value="software">Software</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="operations">Operations</option>
              </select>
            </label>
            <label>Access
              <select [(ngModel)]="spaceAccess">
                <option value="open">Open</option>
                <option value="private">Private</option>
                <option value="secret">Secret</option>
              </select>
            </label>
          </div>
          <p class="error" *ngIf="spaceError()">{{ spaceError() }}</p>
          <footer>
            <button class="ghost" (click)="closeSpaceModal()">Cancel</button>
            <button [disabled]="!spaceName.trim() || !spaceKey.trim() || creatingSpace()" (click)="submitCreateSpace()">
              {{ creatingSpace() ? 'Creating…' : 'Create Space' }}
            </button>
          </footer>
        </div>
      </section>

      <!-- Work Item Create Modal -->
      <section class="modal-backdrop" *ngIf="workItemModalOpen()" (click)="closeWorkItemModal()">
        <div class="command-modal create-modal" (click)="$event.stopPropagation()">
          <h2>Create Work Item</h2>
          <label>Title *
            <input autofocus [(ngModel)]="wiTitle" placeholder="e.g. Implement login page" (keyup.enter)="submitCreateWorkItem()" />
          </label>
          <label>Description
            <textarea [(ngModel)]="wiDescription" rows="3" placeholder="Add details, acceptance criteria, or context…"></textarea>
          </label>
          <label>Space *
            <select [(ngModel)]="wiSpaceId">
              <option value="" disabled>Select a space</option>
              <option *ngFor="let s of spaces()" [value]="s._id">{{ s.name }}</option>
            </select>
          </label>
          <div class="detail-row">
            <label>Type
              <select [(ngModel)]="wiType">
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="epic">Epic</option>
                <option value="subtask">Subtask</option>
              </select>
            </label>
            <label>Priority
              <select [(ngModel)]="wiPriority">
                <option value="lowest">Lowest</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="highest">Highest</option>
              </select>
            </label>
          </div>
          <label>Status
            <select [(ngModel)]="wiStatus">
              <option *ngFor="let col of columns" [value]="col.id">{{ col.label }}</option>
            </select>
          </label>
          <label>Assignee
            <select [(ngModel)]="wiAssigneeId">
              <option value="">Unassigned</option>
              <option *ngFor="let user of users()" [value]="user.id">{{ user.name }} ({{ user.email }})</option>
            </select>
          </label>
          <label>Labels (comma-separated)
            <input [(ngModel)]="wiLabels" placeholder="e.g. frontend, auth, urgent" />
          </label>
          <p class="error" *ngIf="workItemError()">{{ workItemError() }}</p>
          <footer>
            <button class="ghost" (click)="closeWorkItemModal()">Cancel</button>
            <button [disabled]="!wiTitle.trim() || !wiSpaceId || creatingWorkItem()" (click)="submitCreateWorkItem()">
              {{ creatingWorkItem() ? 'Creating…' : 'Create Work Item' }}
            </button>
          </footer>
        </div>
      </section>

      <!-- Directory Create Modal (plans, teams, goals etc.) -->
      <section class="modal-backdrop" *ngIf="createModalOpen()" (click)="closeCreateModal()">
        <div class="command-modal create-modal" (click)="$event.stopPropagation()">
          <h2>New {{ singularLabel(view()) }}</h2>
          <label>{{ singularLabel(view()) }} name *
            <input
              autofocus
              [(ngModel)]="createName"
              placeholder="e.g. Q3 Platform Roadmap"
              (keyup.enter)="submitCreate()" />
          </label>
          <label>Description
            <textarea [(ngModel)]="createDescription" rows="3" placeholder="What is this {{ singularLabel(view()).toLowerCase() }} about?"></textarea>
          </label>
          <label>Status
            <select [(ngModel)]="createStatus">
              <option *ngFor="let option of statusOptionsFor(view())" [value]="option">{{ option }}</option>
            </select>
          </label>
          <p class="error" *ngIf="createError()">{{ createError() }}</p>
          <footer>
            <button class="ghost" (click)="closeCreateModal()">Cancel</button>
            <button [disabled]="!createName.trim() || creating()" (click)="submitCreate()">{{ creating() ? 'Creating…' : 'Create' }}</button>
          </footer>
        </div>
      </section>

      <!-- Invite Modal -->
      <section class="modal-backdrop" *ngIf="inviteModalOpen()" (click)="closeInviteModal()">
        <div class="command-modal create-modal" (click)="$event.stopPropagation()">
          <h2>Invite people{{ inviteTeamName() ? ' to ' + inviteTeamName() : '' }}</h2>
          <label>Email address *
            <input
              autofocus
              type="email"
              [(ngModel)]="inviteEmail"
              placeholder="teammate@company.com"
              (keyup.enter)="submitInvite()" />
          </label>
          <p class="error" *ngIf="inviteError()">{{ inviteError() }}</p>
          <p class="hint" *ngIf="inviteDevLink()">
            SMTP isn't configured, so here's the invite link directly:<br>
            <a [href]="inviteDevLink()" target="_blank">{{ inviteDevLink() }}</a>
          </p>
          <footer>
            <button class="ghost" (click)="closeInviteModal()">Close</button>
            <button [disabled]="!inviteEmail.trim() || sendingInvite()" (click)="submitInvite()">
              {{ sendingInvite() ? 'Sending…' : 'Send invite' }}
            </button>
          </footer>
        </div>
      </section>

      <aside class="detail-panel" *ngIf="activeTask()">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <small style="color:var(--muted)">{{ activeTask()?.key }}</small>
          <button class="close" (click)="closeDetailPanel()">✕</button>
        </div>
        <label style="margin-top:8px">Title
          <input [(ngModel)]="taskDetailTitle" placeholder="Work item title" />
        </label>
        <label>Description
          <textarea [(ngModel)]="taskDetailDescription" rows="4" placeholder="Add a description, acceptance criteria, or notes…"></textarea>
        </label>
        <label>Status
          <select [(ngModel)]="taskDetailStatus">
            <option *ngFor="let column of columns" [value]="column.id">{{ column.label }}</option>
          </select>
        </label>
        <label>Priority
          <select [(ngModel)]="taskDetailPriority">
            <option value="lowest">Lowest</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="highest">Highest</option>
          </select>
        </label>
        <label>Type
          <select [(ngModel)]="taskDetailType">
            <option value="task">Task</option>
            <option value="story">Story</option>
            <option value="bug">Bug</option>
            <option value="epic">Epic</option>
            <option value="subtask">Subtask</option>
          </select>
        </label>
        <label>Assignee
          <select [(ngModel)]="taskDetailAssigneeId">
            <option value="">Unassigned</option>
            <option *ngFor="let user of users()" [value]="user.id">{{ user.name }} ({{ user.email }})</option>
          </select>
        </label>
        <div class="detail-row">
          <label>Story points
            <input type="number" min="0" [(ngModel)]="taskDetailStoryPoints" />
          </label>
          <label>Due date
            <input type="date" [(ngModel)]="taskDetailDueDate" />
          </label>
        </div>
        <label>Labels
          <input [(ngModel)]="taskDetailLabels" placeholder="frontend, risk, customer" />
        </label>
        <p class="error" *ngIf="taskDetailError()">{{ taskDetailError() }}</p>
        <footer style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
          <button class="danger" (click)="deleteTask()">Delete</button>
          <button class="ghost" (click)="toggleWatcher()">Watch</button>
          <button class="ghost" (click)="closeDetailPanel()">Cancel</button>
          <button [disabled]="savingTask()" (click)="saveTaskDetail()">
            {{ savingTask() ? 'Saving…' : 'Save changes' }}
          </button>
        </footer>
        <h2 style="margin-top:20px">Activity</h2>
        <label>Comment
          <textarea [(ngModel)]="newComment" rows="3" placeholder="Add a comment with mentions, markdown, links, or decisions"></textarea>
        </label>
        <button [disabled]="!newComment.trim() || savingTask()" (click)="addComment()">Add comment</button>
        <div class="activity-row" *ngFor="let comment of activeTask()?.comments || []">
          <strong>{{ comment.author?.name || 'Teammate' }}</strong>
          <p>{{ comment.body }}</p>
          <small>{{ comment.createdAt | date:'medium' }}</small>
        </div>
        <div class="activity-row" *ngFor="let change of activeTask()?.history || []">
          <strong>{{ change.field }}</strong>
          <p>Changed from {{ formatChangeValue(change.from) }} to {{ formatChangeValue(change.to) }}</p>
          <small>{{ change.createdAt | date:'medium' }}</small>
        </div>
      </aside>
    </div>
  `
})
export class ShellComponent {
  private readonly api = inject(ApiService);
  private readonly realtime = inject(RealtimeService);
  readonly columns = columns;
  readonly sidebarCollapsed = signal(false);
  readonly profileOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly theme = signal<'light' | 'dark'>('dark');
  readonly view = signal('home');
  readonly selectedFilter = signal('my-open');
  readonly currentUser = signal<User | null>(null);
  readonly users = signal<User[]>([]);
  readonly feedTab = signal('Recommended');
  readonly spaces = signal<Space[]>([]);
  readonly workItems = signal<WorkItem[]>([]);
  readonly directoryItems = signal<DirectoryItem[]>([]);
  readonly teamsList = signal<DirectoryItem[]>([]);
  readonly sprints = signal<Sprint[]>([]);
  readonly notifications = signal<Notification[]>([]);
  readonly selectedSpace = signal<Space | null>(null);
  readonly activeTask = signal<WorkItem | null>(null);
  readonly loadError = signal<string | null>(null);
  query = '';

  // Task detail panel state
  readonly savingTask = signal(false);
  readonly taskDetailError = signal<string | null>(null);
  taskDetailTitle = '';
  taskDetailDescription = '';
  taskDetailStatus: Status = 'todo';
  taskDetailPriority = 'medium';
  taskDetailType = 'task';
  taskDetailAssigneeId = '';
  taskDetailStoryPoints = 0;
  taskDetailDueDate = '';
  taskDetailLabels = '';
  newComment = '';

  // Directory create modal state
  readonly createModalOpen = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  createName = '';
  createDescription = '';
  createStatus = '';

  // Space create modal state
  readonly spaceModalOpen = signal(false);
  readonly creatingSpace = signal(false);
  readonly spaceError = signal<string | null>(null);
  spaceName = '';
  spaceKey = '';
  spaceDescription = '';
  spaceTemplate = 'software';
  spaceAccess = 'open';
  spaceTeamId = '';

  // Work item create modal state
  readonly workItemModalOpen = signal(false);
  readonly creatingWorkItem = signal(false);
  readonly workItemError = signal<string | null>(null);
  wiTitle = '';
  wiDescription = '';
  wiSpaceId = '';
  wiType = 'task';
  wiPriority = 'medium';
  wiStatus: Status = 'todo';
  wiLabels = '';
  wiAssigneeId = '';

  // Directory detail view state
  readonly selectedResource = signal('plans');
  readonly selectedDirectoryItem = signal<DirectoryItem | null>(null);
  readonly savingDetail = signal(false);
  readonly detailError = signal<string | null>(null);
  detailName = '';
  detailDescription = '';
  detailStatus = '';
  detailProgress = 0;

  // Invite modal state
  readonly inviteModalOpen = signal(false);
  readonly sendingInvite = signal(false);
  readonly inviteError = signal<string | null>(null);
  readonly inviteDevLink = signal<string | null>(null);
  readonly pendingInvites = signal<Invite[]>([]);
  inviteEmail = '';

  feedTabs = ['Recommended', 'Assigned to Me', 'Starred', 'Worked On', 'Viewed'];
  quickLinks = [
    { label: 'Board', view: 'board' },
    { label: 'Backlog', view: 'backlog' },
    { label: 'Plans', view: 'plans' },
    { label: 'Dashboards', view: 'dashboards' }
  ];
  navGroups: { title: string; items: { label: string; view: string; filter?: string }[] }[] = [
    { title: 'For You', items: [{ label: 'Recommended', view: 'home' }, { label: 'Assigned to Me', view: 'home' }, { label: 'Worked On', view: 'home' }, { label: 'Viewed', view: 'home' }] },
    { title: 'Recent', items: [{ label: 'Recent Work', view: 'home' }] },
    { title: 'Plans', items: [{ label: 'View plans', view: 'plans' }, { label: 'Create plan', view: 'plans' }] },
    { title: 'Spaces', items: [{ label: 'Board', view: 'board' }, { label: 'Backlog', view: 'backlog' }, { label: 'Timeline', view: 'timeline' }] },
    { title: 'Filters', items: [
      { label: 'My Open Work Items', view: 'filters', filter: 'my-open' },
      { label: 'Reported by Me', view: 'filters', filter: 'reported-by-me' },
      { label: 'All Work Items', view: 'filters', filter: 'all' },
      { label: 'Open Work Items', view: 'filters', filter: 'open' },
      { label: 'Done Work Items', view: 'filters', filter: 'done' },
      { label: 'Viewed Recently', view: 'filters', filter: 'viewed-recently' },
      { label: 'Created Recently', view: 'filters', filter: 'created-recently' },
      { label: 'Updated Recently', view: 'filters', filter: 'updated-recently' }
    ] },
    { title: 'Dashboards', items: [{ label: 'View dashboards', view: 'dashboards' }, { label: 'Create dashboard', view: 'dashboards' }] },
    { title: 'Teams', items: [{ label: 'View teams', view: 'teams' }, { label: 'Create team', view: 'teams' }] },
    { title: 'Goals', items: [{ label: 'View goals', view: 'goals' }, { label: 'Create goal', view: 'goals' }] },
    { title: 'Projects', items: [{ label: 'View projects', view: 'projects' }, { label: 'Create project', view: 'projects' }] }
  ];

  constructor() {
    effect(() => {
      document.body.classList.toggle('light-theme', this.theme() === 'light');
    });
    this.load();
    const socket = this.realtime.connect();
    socket.on('board:moved', () => this.loadWorkItems());
    socket.on('work-item:created', () => this.loadWorkItems());
    socket.on('work-item:updated', () => this.loadWorkItems());
    socket.on('work-item:commented', () => this.loadWorkItems());
    socket.on('sprint:created', () => this.loadSprints());
    socket.on('sprint:started', () => this.loadSprints());
    socket.on('sprint:completed', () => this.loadSprints());
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchOpen.set(true);
    }
  }

  load() {
    this.api.getCurrentUser().subscribe({ next: ({ user }) => this.currentUser.set(user), error: () => this.currentUser.set(null) });
    this.api.listUsers().subscribe({ next: (users) => this.users.set(users), error: () => this.users.set([]) });
    this.api.listSpaces().subscribe({
      next: (spaces) => {
        this.loadError.set(null);
        this.spaces.set(spaces);
        this.selectedSpace.set(spaces[0] || null);
        if (spaces[0]) this.realtime.joinSpace(spaces[0]._id);
        this.loadWorkItems();
        this.loadSprints();
      },
      error: (err) => {
        this.spaces.set([]);
        this.workItems.set([]);
        this.loadError.set(err?.error?.message || 'Could not load your spaces. Is the backend running?');
      }
    });
    this.loadDirectory('plans');
    this.loadNotifications();
    this.api.listDirectory('teams').subscribe({ next: (teams) => this.teamsList.set(teams), error: () => {} });
  }

  loadWorkItems() {
    this.api.listWorkItems(this.selectedSpace() ? { space: this.selectedSpace()!._id } : {}).subscribe({
      next: (items) => {
        this.loadError.set(null);
        this.workItems.set(items);
      },
      error: (err) => {
        this.workItems.set([]);
        this.loadError.set(err?.error?.message || 'Could not load work items.');
      }
    });
  }

  loadDirectory(resource: string) {
    this.api.listDirectory(resource).subscribe({ next: (items) => this.directoryItems.set(items), error: () => this.directoryItems.set([]) });
  }

  loadSprints() {
    this.api.listSprints(this.selectedSpace()?._id).subscribe({ next: (sprints) => this.sprints.set(sprints), error: () => this.sprints.set([]) });
  }

  loadNotifications() {
    this.api.listNotifications().subscribe({ next: (items) => this.notifications.set(items), error: () => this.notifications.set([]) });
  }

  selectSpace(space: Space) {
    this.selectedSpace.set(space);
    this.view.set('board');
    this.realtime.joinSpace(space._id);
    this.loadWorkItems();
    this.loadSprints();
  }
  changeView(view: string, filter?: string) {
    this.view.set(view);

    if (view === 'filters') {
      if (filter) this.selectedFilter.set(filter);
      this.api.listWorkItems().subscribe({
        next: (items) => {
          this.loadError.set(null);
          this.workItems.set(items);
        },
        error: (err) => {
          this.workItems.set([]);
          this.loadError.set(err?.error?.message || 'Could not load work items.');
        }
      });
      return;
    }

    if (['plans', 'teams', 'goals', 'projects', 'dashboards'].includes(view)) {
      this.loadDirectory(view);
    }
    if (view === 'notifications') this.loadNotifications();
  }

  filterTitle() {
    return this.navGroups.find((group) => group.title === 'Filters')?.items
      .find((item) => item.filter === this.selectedFilter())?.label || 'Work Item Filters';
  }

  filteredWorkItems() {
    const q = this.query.trim().toLowerCase();
    const userId = this.currentUser()?.id;
    const filter = this.selectedFilter();
    const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const viewedIds: string[] = JSON.parse(localStorage.getItem('aura.recentWorkItems') || '[]');

    const items = this.workItems().filter((item) => {
      if (q && !item.title.toLowerCase().includes(q) && !item.key.toLowerCase().includes(q)) return false;
      if (filter === 'my-open') return item.status !== 'done' && (item.assignee?.id || item.assignee?._id) === userId;
      if (filter === 'reported-by-me') return (item.reporter?.id || item.reporter?._id) === userId;
      if (filter === 'open') return item.status !== 'done';
      if (filter === 'done') return item.status === 'done';
      if (filter === 'viewed-recently') return viewedIds.includes(item._id);
      if (filter === 'created-recently') return !!item.createdAt && new Date(item.createdAt).getTime() >= recentCutoff;
      if (filter === 'updated-recently') return !!item.updatedAt && new Date(item.updatedAt).getTime() >= recentCutoff;
      return true;
    });

    if (filter === 'viewed-recently') {
      return items.sort((a, b) => viewedIds.indexOf(a._id) - viewedIds.indexOf(b._id));
    }
    if (filter === 'created-recently') {
      return items.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }
    if (filter === 'updated-recently') {
      return items.sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
    }
    return items;
  }

  itemsByStatus(status: Status) {
    return this.filteredItems().filter((item) => item.status === status);
  }

  filteredItems() {
    const q = this.query.toLowerCase();
    return this.workItems().filter((item) => !q || item.title.toLowerCase().includes(q) || item.key.toLowerCase().includes(q));
  }

  sprintItems() {
    return this.workItems().filter((item) => item.status !== 'done').slice(0, 4);
  }

  backlogItems() {
    return this.workItems().slice(4);
  }

  activeSprint() {
    return this.sprints().find((sprint) => sprint.status === 'active') || null;
  }

  nextSprint() {
    return this.sprints().find((sprint) => sprint.status === 'planned') || null;
  }

  createSprint() {
    const space = this.selectedSpace();
    if (!space) return;
    const number = this.sprints().length + 1;
    this.api.createSprint({
      space: space._id,
      name: `${space.key} Sprint ${number}`,
      goal: 'Deliver the next highest-value slice of work'
    }).subscribe({ next: () => this.loadSprints(), error: (err) => this.loadError.set(err?.error?.message || 'Could not create sprint.') });
  }

  startSprint() {
    const sprint = this.nextSprint();
    if (!sprint) return;
    this.api.startSprint(sprint._id).subscribe({ next: () => this.loadSprints(), error: (err) => this.loadError.set(err?.error?.message || 'Could not start sprint.') });
  }

  completeSprint() {
    const sprint = this.activeSprint();
    if (!sprint) return;
    this.api.completeSprint(sprint._id).subscribe({ next: () => this.loadSprints(), error: (err) => this.loadError.set(err?.error?.message || 'Could not complete sprint.') });
  }

  drop(event: CdkDragDrop<WorkItem[]>, status: Status) {
    if (event.previousContainer !== event.container) {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    const task = event.container.data[event.currentIndex];
    if (task) this.api.moveWorkItem(task._id, status, event.currentIndex).subscribe(() => this.loadWorkItems());
  }

  openCreateSpace() {
    this.spaceName = '';
    this.spaceKey = '';
    this.spaceDescription = '';
    this.spaceTemplate = 'software';
    this.spaceAccess = 'open';
    this.spaceTeamId = '';
    this.spaceError.set(null);
    this.spaceModalOpen.set(true);
  }

  closeSpaceModal() {
    this.spaceModalOpen.set(false);
    this.spaceError.set(null);
  }

  submitCreateSpace() {
    const name = this.spaceName.trim();
    const key = this.spaceKey.trim().toUpperCase();
    if (!name || !key) return;
    this.creatingSpace.set(true);
    this.spaceError.set(null);
    this.api.createSpace({
      name,
      key,
      templateType: this.spaceTemplate,
      accessType: this.spaceAccess,
      ...(this.spaceTeamId ? { team: this.spaceTeamId } : {})
    } as any).subscribe({
      next: (space) => {
        this.creatingSpace.set(false);
        this.spaceModalOpen.set(false);
        this.spaces.update((items) => [space, ...items]);
        this.selectedSpace.set(space);
      },
      error: (err) => {
        this.creatingSpace.set(false);
        this.spaceError.set(err?.error?.message || 'Could not create space. Please try again.');
      }
    });
  }

  openCreateWorkItem(status: Status = 'todo') {
    this.wiTitle = '';
    this.wiDescription = '';
    this.wiSpaceId = this.selectedSpace()?._id || (this.spaces()[0]?._id ?? '');
    this.wiType = 'task';
    this.wiPriority = 'medium';
    this.wiStatus = status;
    this.wiLabels = '';
    this.wiAssigneeId = '';
    this.workItemError.set(null);
    this.workItemModalOpen.set(true);
  }

  closeWorkItemModal() {
    this.workItemModalOpen.set(false);
    this.workItemError.set(null);
  }

  submitCreateWorkItem() {
    const title = this.wiTitle.trim();
    if (!title || !this.wiSpaceId) return;
    const labels = this.wiLabels.split(',').map(l => l.trim()).filter(Boolean);
    this.creatingWorkItem.set(true);
    this.workItemError.set(null);
    this.api.createWorkItem({
      space: this.wiSpaceId,
      title,
      description: this.wiDescription.trim() || undefined,
      status: this.wiStatus,
      priority: this.wiPriority as any,
      type: this.wiType as any,
      labels,
      assignee: this.wiAssigneeId || null
    }).subscribe({
      next: (item) => {
        this.creatingWorkItem.set(false);
        this.workItemModalOpen.set(false);
        this.workItems.update((items) => [item, ...items]);
      },
      error: (err) => {
        this.creatingWorkItem.set(false);
        this.workItemError.set(err?.error?.message || 'Could not create work item. Please try again.');
      }
    });
  }

  titleFor(view: string) {
    return view.replace('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  // Timeline / Gantt helpers
  private ganttStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  private ganttEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 5, 0);

  ganttMonths() {
    const months: { label: string; pct: number }[] = [];
    const total = this.ganttEnd.getTime() - this.ganttStart.getTime();
    let d = new Date(this.ganttStart);
    while (d < this.ganttEnd) {
      const start = d.getTime();
      const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const end = Math.min(next.getTime(), this.ganttEnd.getTime());
      months.push({
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        pct: ((end - start) / total) * 100
      });
      d = next;
    }
    return months;
  }

  todayPercent() {
    const total = this.ganttEnd.getTime() - this.ganttStart.getTime();
    const elapsed = Date.now() - this.ganttStart.getTime();
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }

  ganttToday() {
    return new Date().toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  barLeft(task: WorkItem) {
    const total = this.ganttEnd.getTime() - this.ganttStart.getTime();
    const start = task.startDate ? new Date(task.startDate).getTime() : this.defaultStart(task);
    return Math.max(0, Math.min(95, ((start - this.ganttStart.getTime()) / total) * 100));
  }

  barWidth(task: WorkItem) {
    const total = this.ganttEnd.getTime() - this.ganttStart.getTime();
    const start = task.startDate ? new Date(task.startDate).getTime() : this.defaultStart(task);
    const end = task.endDate ? new Date(task.endDate).getTime() : start + this.defaultDuration(task);
    return Math.max(4, Math.min(100 - this.barLeft(task), ((end - start) / total) * 100));
  }

  progressFor(task: WorkItem) {
    if (task.status === 'done') return 100;
    if (task.status === 'in-review') return 75;
    if (task.status === 'in-progress') return 40;
    return 5;
  }

  formatChangeValue(value: unknown) {
    if (value === undefined || value === null || value === '') return 'empty';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    return JSON.stringify(value);
  }

  private defaultStart(task: WorkItem) {
    // Spread tasks across the gantt range using index for demo
    const idx = this.workItems().findIndex(t => t._id === task._id);
    const range = this.ganttEnd.getTime() - this.ganttStart.getTime();
    return this.ganttStart.getTime() + (idx / Math.max(1, this.workItems().length)) * range * 0.7;
  }

  private defaultDuration(task: WorkItem) {
    const durations: Record<string, number> = { epic: 30, story: 14, task: 7, bug: 5, subtask: 3 };
    return (durations[task.type] || 7) * 24 * 60 * 60 * 1000;
  }

  unreadCount() {
    return this.notifications().filter((item) => !item.readAt).length;
  }

  markNotificationRead(item: Notification) {
    if (item.readAt) return;
    this.api.markNotificationRead(item._id).subscribe({ next: () => this.loadNotifications(), error: () => {} });
  }

  markAllNotificationsRead() {
    this.notifications().filter((item) => !item.readAt).forEach((item) => this.markNotificationRead(item));
  }

  logout() {
    localStorage.removeItem('aura.accessToken');
    localStorage.removeItem('aura.refreshToken');
    location.href = '/login';
  }
  createDirectoryItem() {
    this.createName = '';
    this.createDescription = '';
    this.createStatus = this.statusOptionsFor(this.view())[0];
    this.createError.set(null);
    this.createModalOpen.set(true);
  }

  openDetailPanel(task: WorkItem) {
    const recent: string[] = JSON.parse(localStorage.getItem('aura.recentWorkItems') || '[]');
    localStorage.setItem('aura.recentWorkItems', JSON.stringify([task._id, ...recent.filter((id) => id !== task._id)].slice(0, 20)));
    this.activeTask.set(task);
    this.taskDetailTitle = task.title;
    this.taskDetailDescription = task.description || '';
    this.taskDetailStatus = task.status;
    this.taskDetailPriority = task.priority;
    this.taskDetailType = task.type;
    this.taskDetailAssigneeId = task.assignee?.id || task.assignee?._id || '';
    this.taskDetailStoryPoints = task.storyPoints || 0;
    this.taskDetailDueDate = task.dueDate ? task.dueDate.slice(0, 10) : '';
    this.taskDetailLabels = (task.labels || []).join(', ');
    this.newComment = '';
    this.taskDetailError.set(null);
  }

  closeDetailPanel() {
    this.activeTask.set(null);
    this.taskDetailError.set(null);
  }

  saveTaskDetail() {
    const task = this.activeTask();
    if (!task) return;
    const title = this.taskDetailTitle.trim();
    if (!title) return;
    this.savingTask.set(true);
    this.taskDetailError.set(null);
    this.api.updateWorkItem(task._id, {
      title,
      description: this.taskDetailDescription.trim() || undefined,
      status: this.taskDetailStatus,
      priority: this.taskDetailPriority as any,
      type: this.taskDetailType as any,
      assignee: this.taskDetailAssigneeId || null,
      storyPoints: Number(this.taskDetailStoryPoints) || 0,
      dueDate: this.taskDetailDueDate || null,
      labels: this.taskDetailLabels.split(',').map((label) => label.trim()).filter(Boolean)
    }).subscribe({
      next: (updated) => {
        this.savingTask.set(false);
        this.activeTask.set(updated);
        // Update in the local list too
        this.workItems.update(items => items.map(i => i._id === updated._id ? updated : i));
      },
      error: (err) => {
        this.savingTask.set(false);
        this.taskDetailError.set(err?.error?.message || 'Could not save changes. Please try again.');
      }
    });
  }

  deleteTask() {
    const task = this.activeTask();
    if (!task) return;
    if (!confirm(`Delete ${task.key}?`)) return;
    this.api.deleteWorkItem(task._id).subscribe({
      next: () => {
        this.closeDetailPanel();
        this.workItems.update((items) => items.filter((item) => item._id !== task._id));
      },
      error: (err) => this.taskDetailError.set(err?.error?.message || 'Could not delete this issue.')
    });
  }

  addComment() {
    const task = this.activeTask();
    const body = this.newComment.trim();
    if (!task || !body) return;
    this.savingTask.set(true);
    this.api.addComment(task._id, body).subscribe({
      next: (updated) => {
        this.savingTask.set(false);
        this.newComment = '';
        this.activeTask.set(updated);
        this.workItems.update((items) => items.map((item) => item._id === updated._id ? updated : item));
      },
      error: (err) => {
        this.savingTask.set(false);
        this.taskDetailError.set(err?.error?.message || 'Could not add comment.');
      }
    });
  }

  toggleWatcher() {
    const task = this.activeTask();
    if (!task) return;
    this.api.toggleWatcher(task._id).subscribe({
      next: (updated) => {
        this.activeTask.set(updated);
        this.workItems.update((items) => items.map((item) => item._id === updated._id ? updated : item));
      },
      error: (err) => this.taskDetailError.set(err?.error?.message || 'Could not update watchers.')
    });
  }

  closeCreateModal() {
    this.createModalOpen.set(false);
    this.createError.set(null);
  }

  singularLabel(resource: string) {
    const word = resource.slice(0, -1);
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  submitCreate() {
    const name = this.createName.trim();
    if (!name) return;
    const resource = this.view();
    const payload: any = resource === 'goals'
      ? { title: name, description: this.createDescription.trim(), status: this.createStatus, progress: 0 }
      : { name, description: this.createDescription.trim(), status: this.createStatus };

    this.creating.set(true);
    this.createError.set(null);
    this.api.createDirectory(resource, payload).subscribe({
      next: () => {
        this.creating.set(false);
        this.createModalOpen.set(false);
        this.loadDirectory(resource);
        if (resource === 'teams') this.api.listDirectory('teams').subscribe({ next: (teams) => this.teamsList.set(teams), error: () => {} });
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message || 'Could not create this item. Please try again.');
      }
    });
  }

  statusOptionsFor(resource: string) {
    if (resource === 'projects') return ['planning', 'active', 'paused', 'completed'];
    if (resource === 'goals') return ['on-track', 'at-risk', 'off-track', 'completed', 'cancelled'];
    return ['active', 'archived'];
  }

  openDirectoryItem(item: DirectoryItem) {
    const resource = this.view();
    this.selectedResource.set(resource);
    this.selectedDirectoryItem.set(item);
    this.detailName = item.name || item.title || '';
    this.detailDescription = item.description || '';
    this.detailStatus = item.status || this.statusOptionsFor(resource)[0];
    this.detailProgress = item.progress || 0;
    this.detailError.set(null);
    this.view.set('directory-detail');

    this.api.getDirectoryItem(resource, item._id).subscribe({
      next: (full) => {
        this.selectedDirectoryItem.set(full);
        this.detailName = full.name || full.title || '';
        this.detailDescription = full.description || '';
        this.detailStatus = full.status || this.detailStatus;
        this.detailProgress = full.progress || 0;
      },
      error: () => {}
    });

    this.pendingInvites.set([]);
    if (resource === 'teams') {
      this.api.listInvites(item._id).subscribe({ next: (invites) => this.pendingInvites.set(invites), error: () => {} });
    }
  }

  back() {
    const resource = this.selectedResource();
    this.selectedDirectoryItem.set(null);
    this.view.set(resource);
    this.loadDirectory(resource);
  }

  saveDirectoryItem() {
    const item = this.selectedDirectoryItem();
    if (!item) return;
    const resource = this.selectedResource();
    const body: any = {
      description: this.detailDescription,
      status: this.detailStatus,
      progress: Number(this.detailProgress)
    };
    body[resource === 'goals' ? 'title' : 'name'] = this.detailName.trim() || 'Untitled';

    this.savingDetail.set(true);
    this.detailError.set(null);
    this.api.updateDirectory(resource, item._id, body).subscribe({
      next: (updated) => {
        this.savingDetail.set(false);
        this.selectedDirectoryItem.set(updated);
        this.loadDirectory(resource);
      },
      error: (err) => {
        this.savingDetail.set(false);
        this.detailError.set(err?.error?.message || 'Could not save changes. Please try again.');
      }
    });
  }

  deleteDirectoryItem() {
    const item = this.selectedDirectoryItem();
    if (!item) return;
    if (!confirm(`Delete "${this.detailName || 'this item'}"? This cannot be undone.`)) return;
    const resource = this.selectedResource();
    this.api.deleteDirectory(resource, item._id).subscribe({
      next: () => this.back(),
      error: (err) => this.detailError.set(err?.error?.message || 'Could not delete this item.')
    });
  }

  inviteTeamName() {
    return this.selectedDirectoryItem()?.name || '';
  }

  openInviteModal() {
    this.inviteEmail = '';
    this.inviteError.set(null);
    this.inviteDevLink.set(null);
    this.inviteModalOpen.set(true);
  }

  closeInviteModal() {
    this.inviteModalOpen.set(false);
    this.inviteError.set(null);
    this.inviteDevLink.set(null);
  }

  submitInvite() {
    const email = this.inviteEmail.trim();
    if (!email) return;
    const teamId = this.selectedResource() === 'teams' ? this.selectedDirectoryItem()?._id : undefined;

    this.sendingInvite.set(true);
    this.inviteError.set(null);
    this.inviteDevLink.set(null);
    this.api.sendInvite({ email, teamId }).subscribe({
      next: (result) => {
        this.sendingInvite.set(false);
        this.inviteEmail = '';
        if (!result.delivered && result.devLink) {
          // SMTP isn't configured — surface the link directly instead of closing the modal.
          this.inviteDevLink.set(result.devLink);
        } else {
          this.inviteModalOpen.set(false);
        }
        if (teamId) this.api.listInvites(teamId).subscribe({ next: (invites) => this.pendingInvites.set(invites), error: () => {} });
      },
      error: (err) => {
        this.sendingInvite.set(false);
        this.inviteError.set(err?.error?.message || 'Could not send this invite. Please try again.');
      }
    });
  }

}
