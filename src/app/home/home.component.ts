import { HttpClient } from "@angular/common/http";
import { Component, OnInit, inject } from "@angular/core";

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
}