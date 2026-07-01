# AURA Jira-Style Project Management Clone

AURA is a Jira-inspired project management platform built as a full-stack starter:

- Angular 17 standalone frontend with NgRx state, SCSS theming, responsive Jira-style layout, command search, board, backlog, timeline, settings, dashboards, directories, and auth screens.
- Node.js, Express.js, MongoDB, and Mongoose backend with JWT auth, refresh tokens, Google OAuth hooks, Multer uploads, REST APIs, and Socket.io events.
- Domain coverage for spaces, work items, sprints, plans, teams, goals, projects, filters, dashboards, notifications, and user settings.

## Demo Login

After running the seed script, use:

- Email: `ava@aura.demo`
- Password: `Password123!`

## Run Locally

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm start
```

Open `http://localhost:4200`. The API expects MongoDB at `mongodb://127.0.0.1:27017/aura` unless changed in `.env`.

## Feature Coverage

- Jira-style app shell with top navigation, collapsible sidebar, command search, profile menu, dark/light themes, breadcrumbs-oriented page headers, and responsive layouts.
- Project workspace modules for dashboard directories, projects, teams, plans, goals, filters, board, backlog, timeline, notifications, settings, and invite acceptance.
- Kanban board with drag and drop, create/edit/delete issue, priority/type/status/assignee/labels/story points/due date, recent views, filters, and realtime board refresh.
- Backlog and sprint controls with create, start, complete, active sprint, story points, and backlog issue creation.
- Issue side drawer with editable summary, description, status transitions, priority, type, assignee, labels, points, due date, comments, watchers, delete, and activity history.
- Backend persistence for auth, spaces, work items, sprints, comments, work logs, notifications, teams, dashboards, goals, projects, plans, filters, uploads, invites, and realtime Socket.IO events.

## API Highlights

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/spaces`, `POST /api/spaces`
- `GET /api/work-items`, `POST /api/work-items`
- `PATCH /api/work-items/:id/move`
- `POST /api/work-items/:id/comments`
- `POST /api/work-items/:id/work-logs`
- `POST /api/work-items/:id/watch`
- `DELETE /api/work-items/:id`
- `GET /api/sprints`, `POST /api/sprints`
- `POST /api/sprints/:id/start`
- `POST /api/sprints/:id/complete`
- `GET|POST|PUT|DELETE /api/plans|teams|goals|projects|filters|dashboards|notifications`

## Realtime Events

Clients can join a space room with `space:join`. The backend emits:

- `work-item:created`
- `work-item:updated`
- `work-item:deleted`
- `board:moved`
- `work-item:commented`
- `sprint:created`
- `sprint:started`
- `sprint:completed`

## Notes

Run `npm run seed` in the backend to create a populated Jira-like workspace. The app remains fully original in implementation and avoids Jira trademarks/assets while closely following Jira Cloud interaction patterns.

More details:

- [API documentation](docs/API.md)
- [Folder structure](docs/FOLDER_STRUCTURE.md)
