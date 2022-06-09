import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
//services
import { AuthService } from 'src/app/services/auth.service';

//angular form
import { NgForm } from '@angular/forms';

import { finalize } from 'rxjs/operators';
//firebase
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFireDatabase } from '@angular/fire/compat/database';

//browser image resizer
// const readAndCompressImage  = require('browser-image-resizer');
// import { readAndCompressImage } from 'browser-image-resizer';
import { imageConfig } from 'src/utils/config';

import imagemin from 'imagemin';
// import imageminJpegtran from 'imagemin-jpegtran';
// import imageminPngquant from 'imagemin-pngquant';

import { NgxImageCompressService } from 'ngx-image-compress';

//uuid
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css'],
})
export class AddpostComponent implements OnInit {
  locationName: string = '';
  description: string = '';
  picture: string = '';

  user: any = null;
  uploadPercent: any = 0;

  constructor(
    private db: AngularFireDatabase,
    private strorage: AngularFireStorage,
    private toastr: ToastrService,
    auth: AuthService,
    private router: Router,
    private imageCompress: NgxImageCompressService
  ) {
    auth.getUser().subscribe((user: any) => {
      this.db
        .object(`/users/${user.uid}`)
        .valueChanges()
        .subscribe((user: any) => {
          this.user = user;
        });
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    const uid = uuidv4();

    this.db
      .object(`/posts/${uid}`)
      .set({
        id: uid,
        locationName: this.locationName,
        description: this.description,
        picture: this.picture,
        by: this.user.name,
        instaId: this.user.instaUserName,
        date: Date.now(),
      })
      .then(() => {
        this.toastr.success('Post added successfully');
        this.router.navigateByUrl('/');
      })
      .catch((err) => {
        this.toastr.error('Oopsss');
      });
  }

  async uploadFile(event: any) {
    const file = event.target.files[0];


    // let resizedImage = await readAndCompressImage(file, imageConfig);

    const filePath = file.name;
    const fileRef = this.strorage.ref(filePath);

    const task = this.strorage.upload(filePath, file);

    task.percentageChanges().subscribe((percentage) => {
      this.uploadPercent = percentage;
    });

    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.picture = url;
            this.toastr.success('Image upload Success');
          });
        })
      )
      .subscribe();
  }
}
