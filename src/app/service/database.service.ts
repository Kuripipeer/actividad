import { Injectable } from '@angular/core';
import {
  SQLiteDBConnection,
  CapacitorSQLite,
  SQLiteConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private db: SQLiteDBConnection | undefined;
  private sqlite: SQLiteConnection | undefined;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDabatabase() {
    try {
      const dbName = 'base_db';
      const isWeb = Capacitor.getPlatform() === 'web';
      this.db = await this.sqlite?.createConnection(
        dbName,
        isWeb,
        'no-encryption',
        1,
        false
      );

      if (this.db) {
        await this.db.open();
        console.log('database ------------- created');
      }
      const createTable = `
    CREATE TABLE IF NOT EXISTS images(
      id INTEGER PRIMARY KEY,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL
    );
    `;
      await this.db?.execute(createTable);
      console.log('Database initialized');
    } catch (e) {
      console.error('Error initializing database', e);
    }
  }

  async addImage(image: string, description: string, date: string) {
    const query = `INSERT INTO images (image, description, date) VALUES (?, ?, ?);`;
    await this.db?.run(query, [image, description, date]);
  }

  async getImages() {
    const query = `SELECT * FROM images;`;
    const result = await this.db?.query(query);
    return result?.values || [];
  }
}
