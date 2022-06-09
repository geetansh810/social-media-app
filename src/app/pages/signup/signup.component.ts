import { Component, OnInit } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { Router } from "@angular/router";
//services
import { AuthService } from "src/app/services/auth.service";

//angular form
import { NgForm } from "@angular/forms";

import { finalize } from "rxjs/operators";

//firebase
// import { AngularFireStorage } from "@angular/fire/storage";
import { AngularFireStorage } from '@angular/fire/compat/storage';
// import { AngularFireDatabase } from "@angular/fire/database";
import { AngularFireDatabase } from '@angular/fire/compat/database';

//browser image resizer
const readAndCompressImage = require("browser-image-resizer");
import { imageConfig } from "src/utils/config";

@Component({
  selector: "app-signup",
  templateUrl: "./signup.component.html",
  styleUrls: ["./signup.component.css"],
})
export class SignupComponent implements OnInit {
  public href: string = "";
  picture: string =
    "https://cdn-icons.flaticon.com/png/512/5349/premium/5349022.png?token=exp=1654804068~hmac=8eb5d049a267e3963aacbe8c8ab5abe6";

  uploadPercent: any = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.picture = window.location.href.replace("/signup","/assets/programmer.png");
    // console.log(window.location.href.replace("/signup","/assets/programmer.png"));
  }

  onSubmit(f: NgForm) {
    const { email, password, username, country, bio, name } = f.form.value;

    //further sanitization - do here

    this.auth.signUp(email, password)
      .then((res:any) => {
        console.log(res);
        const { uid } = res.user;

        this.db.object(`/users/${uid}`)
          .set({
            id: uid,
            name: name,
            email: email,
            instaUserName: username,
            country: country,
            bio: bio,
            picture: this.picture,
          });
      })
      .then(() => {
        this.router.navigateByUrl("/");
        this.toastr.success("SignUp Success");
      })
      .catch((err) => {
        this.toastr.error("Signup failed");
      });
  }

  async uploadFile(event: any) {
    const file = event.target.files[0];

    let resizedImage = await readAndCompressImage(file, imageConfig);

    const filePath = file.name; // rename the image with TODO: UUID
    const fileRef = this.storage.ref(filePath);

    const task = this.storage.upload(filePath, resizedImage);

    task.percentageChanges().subscribe((percetage) => {
      this.uploadPercent = percetage;
    });

    task.snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.picture = url;
            this.toastr.success("image upload success");
          });
        }),
      )
      .subscribe();
  }
}
