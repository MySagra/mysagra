//server
import express from 'express';
import cors from "cors"
import helmet from 'helmet';
import path from "path";

import { env } from './config/env';

import compression = require('compression');
import { errorHandler } from './middlewares/errorHandler';
import { limiter } from './middlewares/limiter';
import { corsOptions } from './config/corsOptions';

//docs
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from './docs/swagger';

//routes
import loginRouter from "@/routes/auth/login.route"
import categoryRouter from "@/routes/category.route"
import foodRouter from "@/routes/food.routes"
import orderRouter from "@/routes/order.route"
import roleRouter from "@/routes/role.route"
import userRouter from "@/routes/user.route"
import statsRouter from "@/routes/stats.route"
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
//TODO: setup limiter for webapp app.use(limiter);

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
app.use("/auth/login", loginRouter)
app.use("/v1/categories", categoryRouter);
app.use("/v1/foods", foodRouter);
app.use("/v1/orders", orderRouter);
app.use("/v1/roles", roleRouter);
app.use("/v1/users", userRouter);
app.use("/v1/stats", statsRouter);

//error handling for 404
app.use((req, res, next) => {
  res.status(404).json({
    status: "error",
    message: "Not Found",
  });
});

//error middleware
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server is listening on http://localhost:${env.PORT}`);
  console.log(`Documentation: http://localhost:${env.PORT}/api-docs`);
});