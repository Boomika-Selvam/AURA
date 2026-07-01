import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import { errorHandler } from './middleware/errorHandler.js';
import { configureGoogleStrategy } from './services/googleOAuth.js';
import authRoutes from './routes/auth.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import workItemRoutes from './routes/workItem.routes.js';
import sprintRoutes from './routes/sprint.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import inviteRoutes from './routes/invite.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:4200', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(passport.initialize());
configureGoogleStrategy();

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'aura-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/work-items', workItemRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api', resourceRoutes);
app.use(errorHandler);

export default app;
