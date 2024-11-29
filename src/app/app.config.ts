import { APP_INITIALIZER, ApplicationConfig, provideExperimentalZonelessChangeDetection } from "@angular/core";
import { provideRouter, withEnabledBlockingInitialNavigation } from "@angular/router";
import { provideClientHydration, withEventReplay } from "@angular/platform-browser";
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";

import { take, tap } from "rxjs";

import { httpInterceptor } from "./http.interceptor";
import { TokenService } from "./token.service";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
	providers: [
		provideExperimentalZonelessChangeDetection(),
		provideRouter(routes, withEnabledBlockingInitialNavigation()),
		provideClientHydration(withEventReplay()),
		provideHttpClient(withFetch(), withInterceptors([httpInterceptor])),
		{
			provide: APP_INITIALIZER,
			useFactory: (http: HttpClient, token: TokenService) => {
				return () =>
					http.get<{ token: string }>("/token/session").pipe(
						tap((res) => token.next(res.token)),
						take(1)
					);
			},
			multi: true,
			deps: [HttpClient, TokenService]
		}
	]
};