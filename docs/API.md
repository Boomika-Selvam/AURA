# API Documentation

Base URL: `http://localhost:5000/api`

Authentication uses JWT bearer tokens. Register or log in, then send `Authorization: Bearer <accessToken>`.

## Auth

- `POST /auth/register` creates a user and returns access/refresh tokens.
- `POST /auth/login` returns access/refresh tokens.
- `GET /auth/me` returns the current user.
- `GET /auth/users` lists users for assignment controls.

## Workspaces and Directory Resources

The generic resource controller supports:

- `GET /spaces`, `POST /spaces`, `GET /spaces/:id`, `PUT /spaces/:id`, `DELETE /spaces/:id`
- `GET|POST|PUT|DELETE /plans`
- `GET|POST|PUT|DELETE /teams`
- `GET|POST|PUT|DELETE /goals`
- `GET|POST|PUT|DELETE /projects`
- `GET|POST|PUT|DELETE /filters`
- `GET|POST|PUT|DELETE /dashboards`
- `GET /notifications`
- `POST /notifications/:id/read`

Resources are scoped to the authenticated user's ownership, team membership, or workspace access.

## Work Items

- `GET /work-items` lists visible issues. Query parameters: `space`, `status`, `priority`, `assignee`, `sprint`, `team`, `type`, `label`.
- `POST /work-items` creates an issue.
- `GET /work-items/:id` returns a populated issue.
- `PUT /work-items/:id` updates issue fields and appends history entries.
- `DELETE /work-items/:id` deletes an issue.
- `PATCH /work-items/:id/move` updates board column and order.
- `POST /work-items/:id/comments` adds a comment and emits realtime updates.
- `POST /work-items/:id/work-logs` records time.
- `POST /work-items/:id/watch` toggles the current user as watcher.

## Sprints

- `GET /sprints?space=<spaceId>` lists sprints.
- `POST /sprints` creates a sprint.
- `POST /sprints/:id/start` starts a planned sprint.
- `POST /sprints/:id/complete` completes an active sprint and moves unfinished issues back to backlog.

## Invites and Uploads

- `POST /invites` sends or generates an invitation link.
- `GET /invites/:token` previews an invite.
- `POST /invites/:token/accept` accepts an invite.
- `POST /uploads` uploads files through Multer.

## Realtime Events

Clients join a room with `space:join`.

The server emits `work-item:created`, `work-item:updated`, `work-item:deleted`, `work-item:commented`, `board:moved`, `sprint:created`, `sprint:started`, and `sprint:completed`.
