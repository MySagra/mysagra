import express from 'express';
import cors from "cors"
import helmet from 'helmet';
import path from "path";

import { env } from './config/env';

// app utils
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler';
import { corsOptions } from './config/corsOptions';

//routes
import routes from "./routes"

//docs
import { setupSwagger } from './config/swagger';

// middlewares
import { requestId } from './middlewares/requestId';
import { loggingMiddleware } from './middlewares/logging';
import { extractUser } from './middlewares/extractUser';

//app config
const app = express();
app.set('query parser', 'extended');

// trust nginx
if (env.NODE_ENV === "production") {
    app.set('trust proxy', env.TRUST_PROXY_LEVEL); //trust nginx reverse proxy
    app.disable('x-powered-by');
}

// security middlewares
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'", ...env.ALLOWED_ORIGINS || ""],
        imgSrc: ["'self'", "data:", ...env.ALLOWED_ORIGINS || ""],
        scriptSrc: ["'self'", ...env.ALLOWED_ORIGINS || ""],
        styleSrc: ["'self'", ...env.ALLOWED_ORIGINS || "", "'unsafe-inline'"],
    }
}));

// generate documentation
setupSwagger(app)

//global middlewares
app.use(requestId);
app.use(loggingMiddleware);
app.use(extractUser());

app.use((req, res, next) => {
    if (req.path.startsWith('/events')) {
        return next(); // Salta compression per SSE
    }
    compression()(req, res, next);
});

if (env.NODE_ENV !== "production") {
    app.get('/v1/test-ip', (req, res) => {
        const clientIp = req.ip;
        res.json({ ip: clientIp, env: env.NODE_ENV });
    });
}

// static routes
app.use(express.static(path.join(__dirname, '../public')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// health endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
    });
});

// api endpoints
app.use(routes);

//error handling for 404
app.use((_req, res, _next) => {
    res.status(404).json({
        status: "error",
        message: "Not Found",
    });
});

// error middleware
app.use(errorHandler);

export default app;