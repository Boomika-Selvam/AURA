# Folder Structure

```text
AURA/
  backend/
    src/
      app.js                 Express app, middleware, and route mounting
      server.js              HTTP and Socket.IO bootstrap
      seed.js                Demo Jira-like workspace seed data
      controllers/           Route handlers for auth, resources, sprints, work items, invites
      middleware/            Auth, upload, and error handling
      models/                Mongoose schemas for users, spaces, issues, sprints, directories
      routes/                REST route declarations
      services/              Database, tokens, mailer, OAuth, notifications, access scoping
      sockets/               Realtime room/event wiring
    uploads/                 Uploaded user files
  frontend/
    src/
      app/
        app.component.ts     Router outlet root
        shell.component.ts   Jira-style authenticated product shell
        core/                API client, auth guard/interceptor, models, realtime service
        features/            Auth and invite acceptance screens
        state/               NgRx reducer registration
      styles.scss            Global themes, responsive layout, board/timeline/drawer styling
```

The implementation keeps the original stack: Angular standalone components, NgRx registration, Angular CDK drag and drop, Express, MongoDB/Mongoose, JWT auth, uploads, and Socket.IO.
