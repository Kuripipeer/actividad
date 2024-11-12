import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DatabaseService } from '../service/database.service';
import {
  LocalNotifications,
  ScheduleOptions,
} from '@capacitor/local-notifications';
import { AlertController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  photo: string | undefined;
  description: string | undefined;
  images: any[] = [];
  isButtonDisabled = false;
  countdown: number | null = null;
  showIntegrantes = false;
  integrantes = [
    {
      nombre: 'Christian Axel',
      apellido: 'Moreno Flores',
    },
    {
      nombre: 'Angel Alejandro',
      apellido: 'Becerra Rojas',
    },
    {
      nombre: 'Grecia',
      apellido: 'Navarrete Mexicano',
    },
    {
      nombre: 'Ximena',
      apellido: 'Gutiérrez Pérez',
    },
  ];

  async ngOnInit() {
    await this.databaseService.initializeDabatabase();
    await this.loadImages();
    await this.loadState();
    await this.requestPermission();

    LocalNotifications.addListener(
      'localNotificationReceived',
      (notification) => {
        console.log('Notificación recibida: ', notification);
        this.isButtonDisabled = false;
        this.countdown = null;
      }
    );
  }

  async requestPermission() {
    try {
      const value = await LocalNotifications.requestPermissions();
      if (value.display === 'granted') {
        LocalNotifications.addListener(
          'localNotificationActionPerformed',
          async (notification) => {
            console.log('Notificación activada: ', notification);
            this.isButtonDisabled = false;
            this.countdown = null;

            await Preferences.set({ key: 'isButtonDisabled', value: 'false' });
            await Preferences.remove({ key: 'endTime' });
          }
        );
      }
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }

  async scheduleNotification() {
    const notificationTime = new Date(Date.now() + 30 * 1000); // 20 segundos a partir de ahora
    // alert('Notificación programada para: ' + notificationTime.toLocaleString());

    const options: ScheduleOptions = {
      notifications: [
        {
          title: 'Hora de guardar un recuerdo',
          body: 'Guarda un nuevo recuerdo',
          id: Math.floor(Math.random() * 100000),
          schedule: { at: notificationTime },
          sound: 'default', // Especifica el sonido aquí
          attachments: undefined,
          actionTypeId: '',
          extra: null,
        },
      ],
    };

    try {
      await LocalNotifications.schedule(options);
      // alert('Notificación programada');
      this.startCountdown(30);
    } catch (error) {
      alert(JSON.stringify(error));
    }
  }

  handleButtonClick() {
    this.isButtonDisabled = true;
    Preferences.set({ key: 'isButtonDisabled', value: 'true' });
    this.scheduleNotification();
  }

  async startCountdown(seconds: number) {
    const endTime = Date.now() + seconds * 1000;
    await Preferences.set({ key: 'endTime', value: endTime.toString() });

    this.countdown = seconds;
    const interval = setInterval(async () => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      this.countdown = timeLeft;

      if (this.countdown <= 0) {
        clearInterval(interval);
        this.isButtonDisabled = false;
        await Preferences.set({ key: 'isButtonDisabled', value: 'false' });
        await Preferences.remove({ key: 'endTime' });
      }
    }, 1000);
  }

  constructor(
    private databaseService: DatabaseService,
    private alertController: AlertController
  ) {}

  async loadState() {
    const buttonState = await Preferences.get({ key: 'isButtonDisabled' });
    const endTimeValue = await Preferences.get({ key: 'endTime' });

    this.isButtonDisabled = buttonState.value === 'true';

    if (endTimeValue.value) {
      const endTime = parseInt(endTimeValue.value, 10);
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));

      if (timeLeft > 0) {
        this.countdown = timeLeft;
        this.startCountdown(timeLeft);
      } else {
        this.isButtonDisabled = false;
        this.countdown = null;
        await Preferences.set({ key: 'isButtonDisabled', value: 'false' });
        await Preferences.remove({ key: 'endTime' });
      }
    }
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
      this.handleButtonClick();
      this.loadImages();
    } else {
      alert('Debe seleccionar una imagen y escribir una descripcion');
    }
  }

  async deleteImage(id: number) {
    await this.databaseService.deleteImage(id);
    await this.loadImages();
  }

  async confirmDeleteImage(id: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro de que desea eliminar esta imagen?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteImage(id);
          },
        },
      ],
    });

    await alert.present();
  }

  toggleIntegrantes() {
    this.showIntegrantes = !this.showIntegrantes;
  }
}
