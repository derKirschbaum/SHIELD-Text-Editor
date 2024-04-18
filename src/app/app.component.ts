import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AES, enc } from 'crypto-ts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(private titleService: Title, private cdr: ChangeDetectorRef) {
    this.titleService.setTitle('Welcome to SHIELD!');

    (window as any).manager.updateFileNameAndPath(
      (fileName: string, path: string) => {
        this.fileName = fileName;
        this.path = path;
        this.actionType = 'open';
      }
    );

    (window as any).manager.requestSaveAndQuit(() => {
      this.isRequestQuit = true;
      if (this.actionType === 'open') this.openSaveWithPasswordAndQuit();
      if (this.actionType === 'new') this.saveNewFileWithPassword();
    });

    // Ctrl + S to Save!
    document.addEventListener('keydown', (ev) => {
      if (ev.ctrlKey && ev.key === 's' && this.actionType === 'open') {
        //! Prevent default "Save" dialogue
        ev.preventDefault();

        if (this.isEncrypted && this.changes) {
          let encryptedText = AES.encrypt(
            this.content,
            this.password
          ).toString();

          let obj = {
            content: encryptedText,
          };

          (window as any).manager.saveFile(this.path, JSON.stringify(obj));

          this.updateTitle(this.fileName + ' - Encrypted'); // remove (unsaved)

          this.changes = false;

          this.updateSaveStatus(!this.changes);
        } else {
          this.isOpenSavePasswordModal = true;
        }
      }

      if (ev.ctrlKey && ev.key === 's' && this.actionType === 'new') {
        //! Prevent default "Save" dialogue
        ev.preventDefault();

        this.isNewAskForEncryption = true;
      }
    });
  }

  showLanding: boolean = true;
  showSpinner: boolean = false;
  fileName: string = '';
  path: string = '';
  content: any = '';

  password: string = '';

  actionType: string = '';

  changes: boolean = false;

  isOpenSavePasswordModal: boolean = false;

  isOpenAskForPasswordModal: boolean = false;

  isNewAskForEncryption: boolean = false;

  isEncrypted = false;

  isInvalidPassword = false;

  cipherText: string = '';

  isRequestQuit: boolean = false;

  saveNewFileWithPassword() {
    if (this.password != '') {
      let encryptedText = AES.encrypt(this.content, this.password).toString();

      let obj = {
        content: encryptedText,
      };

      (window as any).manager.saveNewFile(JSON.stringify(obj));

      this.changes = false;

      this.updateSaveStatus(!this.changes);
  
      this.isEncrypted = true;
  
      this.isNewAskForEncryption = false;
  
      this.cdr.detectChanges();
    }
    else {

      (window as any).manager.saveNewFile(this.content);

      this.changes = false;

      this.updateSaveStatus(!this.changes);
  
      this.isEncrypted = true;
  
      this.isNewAskForEncryption = false;
  
      this.cdr.detectChanges();
    }



    if (this.isRequestQuit) (window as any).manager.requestQuit();
  }

  openSaveWithPasswordAndQuit() {
    if (this.isEncrypted && this.changes) {
      let encryptedText = AES.encrypt(this.content, this.password).toString();

      let obj = {
        content: encryptedText,
      };

      (window as any).manager.saveFile(this.path, JSON.stringify(obj));

      this.updateTitle(this.fileName + ' - Encrypted'); // remove (unsaved)

      this.changes = false;

      this.updateSaveStatus(!this.changes);

      (window as any).manager.requestQuit();
    } else {
      this.isOpenSavePasswordModal = true;
      this.cdr.detectChanges();
    }
  }

  openSaveWithNewPassword() {
    if (this.password == '') {
      (window as any).manager.saveFile(this.path, this.content);

      this.updateTitle(this.fileName); // remove (unsaved)

      this.changes = false;

      this.updateSaveStatus(!this.changes);

      this.isOpenSavePasswordModal = false;

      if (this.isRequestQuit) (window as any).manager.requestQuit();
    } else {
      let encryptedText = AES.encrypt(this.content, this.password).toString();

      let obj = {
        content: encryptedText,
      };

      (window as any).manager.saveFile(this.path, JSON.stringify(obj));

      this.updateTitle(this.fileName + ' - Encrypted'); // remove (unsaved)

      this.changes = false;

      this.isEncrypted = true;

      this.updateSaveStatus(!this.changes);

      this.isOpenSavePasswordModal = false;

      if (this.isRequestQuit) (window as any).manager.requestQuit();
    }
  }

  openEncryptedFile() {
    let decryptionResult = AES.decrypt(this.cipherText, this.password).toString(
      enc.Utf8
    );

    if (decryptionResult == '') {
      this.isInvalidPassword = true;
    } else {
      this.content = decryptionResult;
      this.isEncrypted = true;

      this.isOpenAskForPasswordModal = false;
      this.isInvalidPassword = false;

      this.changes = false;

      this.showLanding = false;
      this.titleService.setTitle(this.fileName);

      this.updateTitle(this.fileName);
      this.updateType('open');
    }
  }

  updateChanges() {
    this.changes = true;

    if (this.actionType === 'open')
      this.updateTitle(this.fileName + ' (Unsaved)');
    else this.updateTitle('Untitled (Unsaved)');
    this.updateSaveStatus(false);
  }

  openFileDialog() {
    document.getElementById('fileDialog')?.click();
  }

  updateType(type: string) {
    this.actionType = type;
    (window as any).manager.updateType(type);
  }

  createNewFile() {
    this.changes = false;
    this.updateTitle('Untitled');
    this.updateSaveStatus(!this.changes);

    this.showLanding = false;

    this.updateType('new');
  }

  updateTitle(title: string) {
    (window as any).manager.updateTitle(title);
  }

  updateSaveStatus(status: boolean) {
    (window as any).manager.updateSaveStatus(status);
  }

  handleFileInput(event: any) {
    let inputFile: File = event.target.files[0];
    let reader: FileReader = new FileReader();
    this.fileName = inputFile.name;
    this.path = (inputFile as any).path;

    reader.readAsText(inputFile, 'UTF-8');

    reader.addEventListener('loadstart', (ev) => {
      this.showSpinner = true;
    });

    reader.addEventListener('loadend', (ev) => {
      //The result is in reader.result
      let result = reader.result?.toString();

      try {
        if (result) {
          // try to parse json for encrypted content
          let json = JSON.parse(result);
          if (!json.content) throw 'Invalid format!';

          this.isOpenAskForPasswordModal = true;
          this.cipherText = json.content;
        }
      } catch {
        // If error, then it should be a plain text
        this.content = reader.result?.toString();
        this.updateTitle(this.fileName);
        this.updateType('open');

        this.isEncrypted = false;
        this.showLanding = false;
        this.changes = false;
        this.updateSaveStatus(!this.changes);
        this.titleService.setTitle(this.fileName);
      }
    });
  }
}
