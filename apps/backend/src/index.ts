// Module alias registration (must be first)
import 'module-alias/register';

//server
import express from 'express';
import cors from "cors"
import helmet from 'helmet';
import path from "path";

import { env } from './config/env';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler';
import { corsOptions } from './config/corsOptions';

//docs
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from './docs/swagger';

//routes
import routes from "@/routes"

import { requestId } from './middlewares/requestId';
import { loggingMiddleware } from './middlewares/logging';

//app config
const app = express();

//trust nginx
if (env.NODE_ENV === "production") {
  app.set('trust proxy', 1); //trust nginx reverse proxy
  app.disable('x-powered-by');
}

//security middlewares
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", env.FRONTEND_URL || ""],
    imgSrc: ["'self'", "data:", env.FRONTEND_URL || ""],
    scriptSrc: ["'self'", env.FRONTEND_URL || ""],
    styleSrc: ["'self'", env.FRONTEND_URL || "", "'unsafe-inline'"],
  }
}));

//global middlewares
app.use(requestId);
app.use(loggingMiddleware);
app.use(compression());

//static routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

//health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
});

//routes
app.use(routes);

//error handling for 404
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
  });
});

//error middleware
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server is listening on http://localhost:${env.PORT}`);
  console.log(`Documentation: http://localhost:${env.PORT}/api-docs`);
});

function shutdown() {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);