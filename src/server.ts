import 'reflect-metadata';
import express from 'express';
import morgan from 'morgan';
import { AppDataSource } from './data-source';

import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import communitiesRoutes from './routes/communities';
import postRoutes from './routes/post';
import votesRoutes from './routes/votes';

const app = express();

app.use(express.json());
const origin = process.env.ORIGIN;
app.use(cors({ origin, credentials: true }));
app.use(morgan('dev'));
app.use(cookieParser());
dotenv.config();

app.get('/', (_, res) => res.send('running server'));

// routes
app.use('/api/auth', authRoutes);
app.use('/api/communities', communitiesRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/votes', votesRoutes);

app.use(express.static('public'));
let port = 4000;

app.listen(port, async () => {
  console.log(`server running at ${process.env.APP_URL}`);

  AppDataSource.initialize()
    .then(async () => {
      console.log('database initialized');
    })
    .catch((error) => console.log(error));
});
