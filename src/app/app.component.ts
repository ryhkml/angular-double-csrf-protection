import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: "./app.component.html",
	host: {
		"[attr.ng-version]": "0"
	}
})
export class AppComponent {
	readonly title = "hello";
}
