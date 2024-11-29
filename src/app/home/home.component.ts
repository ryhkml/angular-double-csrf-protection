import { HttpClient } from "@angular/common/http";
import { Component, OnInit, inject } from "@angular/core";
import { tap } from "rxjs";

@Component({
	selector: "app-home",
	standalone: true,
	templateUrl: "./home.component.html",
	styleUrl: "./home.component.scss"
})
export class HomeComponent implements OnInit {
	private http = inject(HttpClient);

	ngOnInit() {
		this.http.post("/register", {}).subscribe({
			next: console.log,
			error: console.error
		});
	}

	getNewData() {
		this.http
			.post("/register", {})
			.pipe(tap(() => console.log("OK")))
			.subscribe({
				next: console.log,
				error: console.error
			});
	}
}
