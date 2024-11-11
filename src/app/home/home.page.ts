import { Component } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DatabaseService } from '../service/database.service';
import {
  LocalNotifications,
  ScheduleOptions,
} from '@capacitor/local-notifications';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  photo: string | undefined;
  description: string | undefined;
  images: any[] = [];

  async ngOnInit() {}

  async scheduleNotification() {
    try {
      const value = await LocalNotifications.requestPermissions();
      if (value.display !== 'granted') {
        alert('Notification permissions are not granted');
        return;
      }
    } catch (error) {
      alert(JSON.stringify(error));
    }

    let options: ScheduleOptions = {
      notifications: [
        {
          id: 111,
          title: 'Prueba notificacion',
          body: 'Esto es una prueba de notificacion',
          largeBody: 'Notficaciones de pruebas de la aplicacion',
          summaryText: 'Resumen de la notificacion',
        },
      ],
    };

    try {
      await LocalNotifications.schedule(options);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }

  constructor(private databaseService: DatabaseService) {
    this.loadImages();
  }

  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 10, // Reduce the quality to lower the size
      allowEditing: true,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    // Guardar la imagen en formato base64
    this.photo = `data:image/jpeg;base64,${image.base64String}`;
  }

  async loadImages() {
    this.images = await this.databaseService.getImages();
  }

  async saveImage() {
    // Guardar la imagen en la base de datos
    if (this.photo && this.description) {
      await this.databaseService.addImage(
        this.photo,
        this.description,
        new Date().toISOString()
      );
      this.photo = undefined;
      this.description = undefined;
      this.loadImages();
    } else {
      alert('Debe seleccionar una imagen y escribir una descripcion');
    }
  }
}
