import { Component } from '@angular/core';
import { DatabaseService } from './service/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(private databaseService: DatabaseService) {
    this.initializeDatabase();
  }

  async initializeDatabase() {
    await this.databaseService.initializeDabatabase();
  }
}
