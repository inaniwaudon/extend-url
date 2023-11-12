import { Hono } from "hono";

import indexRouter from "./router/index";
import extendRouter from "./router/extend";

// Hono
export interface Env {}

const app = new Hono();

app.route("/", indexRouter);
app.route("/", extendRouter);

app.fire();

export default app;
