import { APP_BASE_HREF } from "@angular/common";
import { CommonEngine } from "@angular/ssr";

import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:https";
import { cwd, env } from "node:process";
import { join } from "node:path";

import express, { Response } from "express";
import { doubleCsrf } from "csrf-csrf";
import { json } from "body-parser";

import { RESPONSE } from "./src/express.token";
import { REQUEST as SSR_REQUEST } from "ngx-cookie-service-ssr";

import bootstrap from "./src/main.server";

import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
	const server = express();
	const browserDir = join(cwd(), "dist/hello/browser");
	const indexHtml = existsSync(join(browserDir, "index.original.html"))
		? join(browserDir, "index.original.html")
		: join(browserDir, "index.html");

	const commonEngine = new CommonEngine();

	server.set("view engine", "html");
	server.set("views", browserDir);
	server.set("trust proxy", true);

	server.disable("x-powered-by");

	// Middleware
	server.use(compression());
	server.use(json());
	server.use(cookieParser(env["COOKIE_PARSER_SECRET"]));

	const { invalidCsrfTokenError, generateToken, doubleCsrfProtection } = doubleCsrf({
		cookieName: String(env["COOKIE_NAME"]),
		getSecret: () => String(env["COOKIE_SECRET"]),
		cookieOptions: {
			sameSite: "strict",
			path: "/",
			secure: true
		},
		getTokenFromRequest: (req) => String(req.headers["x-csrf-token"])
	});

	// Routes
	// @ts-ignore
	server.get(
		"/token/session",
		cors({
			origin: true,
			methods: ["GET", "HEAD"]
		}),
		(req, res) =>
			res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate").json({
				token: generateToken(req, res, true)
			})
	);

	// @ts-ignore
	function csrfErrorHandler(error, _, res: Response, next) {
		// Handing CSRF mismatch errors
		// For production use: send to a logger
		if (error == invalidCsrfTokenError) {
			return res.status(403).end();
		}
		next();
	}

	server.use(doubleCsrfProtection);
	server.use(csrfErrorHandler);

	server.post(
		"/register",
		cors({
			origin: true,
			methods: "POST"
		}),
		(_, res) => {
			return res.json({
				status: "OK"
			});
		}
	);

	// Example Express Rest API endpoints
	// server.get("/api/**", (req, res) => { });
	// Serve static files from /browser
	server.get(
		"*.*",
		express.static(browserDir, {
			maxAge: "1y"
		})
	);

	// All regular routes use the Angular engine
	// @ts-ignore
	server.get("*", (req, res, next) => {
		const { protocol, originalUrl, baseUrl, headers } = req;
		commonEngine
			.render({
				bootstrap,
				documentFilePath: indexHtml,
				url: `${protocol}://${headers.host}${originalUrl}`,
				publicPath: browserDir,
				providers: [
					{ provide: APP_BASE_HREF, useValue: baseUrl },
					{ provide: SSR_REQUEST, useValue: req },
					{ provide: RESPONSE, useValue: res }
				]
			})
			.then((html) => res.send(html))
			.catch((err) => next(err));
	});

	return server;
}

function run() {
	const port = Number(env["PORT"]) || 4200;
	if (env["SERVE_PROTOCOL"] == "https") {
		const server = createServer(
			{
				cert: readFileSync("tls/fullchain.pem"),
				key: readFileSync("tls/cert-key.pem")
			},
			app()
		);
		server.listen(port);
		console.log("Server listening on", "https://localhost:" + port);
	} else {
		app().listen(port);
		console.log("Server listening on", "http://localhost:" + port);
	}
}

run();
