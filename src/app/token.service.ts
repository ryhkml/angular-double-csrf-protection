import { Injectable, signal } from "@angular/core";

@Injectable({
	providedIn: "root"
})
export class TokenService {

	private readonly token = signal("");

	next(value: string) {
		this.token.set(value);
	}

	value() {
		return this.token();
	}
}