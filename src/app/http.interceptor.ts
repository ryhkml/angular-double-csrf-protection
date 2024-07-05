import { Injector, PLATFORM_ID, inject } from "@angular/core";
import { DOCUMENT, isPlatformServer } from "@angular/common";
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";

import { EMPTY, Observable, catchError, throwError } from "rxjs";
import { Request } from "express";

import { REQUEST } from "../express.token";
import { TokenService } from "./token.service";

export function httpInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {

    const isServer = isPlatformServer(inject(PLATFORM_ID));
    const document = inject(DOCUMENT);
    const injector = inject(Injector);
    const token = inject(TokenService);

	let credential: boolean | undefined = undefined;
	let headers: { [k: string]: string } = {
		"User-Agent": document.defaultView!.navigator.userAgent
	};

	const method = req.method.toUpperCase();
	if ((req.url.startsWith("./") || req.url.startsWith("/")) && method != "GET" && token.value()) {
		credential = true;
		headers = {
			...headers,
			"X-CSRF-Token": token.value()
		};
	} else {
		if ((req.url.startsWith("./") || req.url.startsWith("/")) && method == "GET") {
			credential = true;
		}
	}
	
	const newReq = req.clone({
		withCredentials: credential,
		setHeaders: headers
	});

    if (isServer && !req.url.startsWith("//") && (req.url.startsWith("./") || req.url.startsWith("/")) ) {
        const serverReq = injector.get(REQUEST) as Request;
        const baseURL = serverReq.protocol + "://" + serverReq.get("Host");
        let endpoint = req.url;
        if (endpoint.startsWith(".")) {
            endpoint = endpoint.substring(1);
        }
		const newServerReq = newReq.clone({
			url: baseURL + endpoint
		});
		return next(newServerReq).pipe(
			catchHttpError()
		);
    }

    return next(newReq).pipe(
        catchHttpError()
    );
};

function catchHttpError() {
    return function(source: Observable<HttpEvent<unknown>>) {
        return source.pipe(
            catchError(e => {
                if (e instanceof HttpErrorResponse) {
					const hostname = new URL(e.url || "").hostname;
                    if (e.status == 0 || e.statusText == "Unknown Error" || hostname == "localhost" || hostname == "127.0.0.1") {
                        return EMPTY;
                    }
					return throwError(() => e);
                }
                return throwError(() => e);
            })
        );
    };
};