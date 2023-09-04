import { Component, OnInit } from '@angular/core';
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import { HttpClient } from '@angular/common/http';
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MatSnackBar} from "@angular/material/snack-bar";
import {delay} from "rxjs";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  animations: [
    trigger('fadeInOut', [
      state('hidden', style({ opacity: 0, height: 0 })),
      state('visible', style({ opacity: 1, height: '*' })),
      transition('hidden => visible', animate('300ms ease-in')),
      transition('visible => hidden', animate('300ms ease-out')),
    ]),
  ],
})
export class FileUploadComponent implements OnInit {

  uploadedFile: File[] | null = null; // Store the uploaded file here
  parser: XMLParser | null = null;
  builder: XMLBuilder | null = null;
  successMessage: string | null = null;
  uploading: boolean = false;
  uploadProgress: number = 0;
  selectedFileName: string = 'No file chosen';

  constructor(private http: HttpClient, private snackBar: MatSnackBar) { }

  ngOnInit() {
    const options = {
      ignoreAttributes: false,
      attributeNamePrefix : "@_"
    };
    this.parser = new XMLParser(options);
    this.builder = new XMLBuilder(options);
  }


  onFileSelected(input: any): void {
    this.uploadedFile = input.files;
    if (this.uploadedFile) {
      this.selectedFileName = '';
      for(var fName of this.uploadedFile){
        this.selectedFileName += '{'+fName.name+'}';
      }
    } else {
      this.selectedFileName = 'No file chosen';
    }
  }

  async onUpload(): Promise<void> {
    if (this.uploadedFile) {
      this.uploading = true;

      for(var file of this.uploadedFile) {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = async (e) => {
          const fileContent = reader.result as string;
          // @ts-ignore
          let jObj = this.parser.parse(fileContent);
          this.processXml(jObj);
          console.log(jObj)
          //backend call
          this.http.post<any>('http://localhost:8080/api/v1/receive-data', this.builder?.build(jObj), {
            reportProgress: true,
            observe: 'events',
          })
            .subscribe({
              next: (data) => {
                if(data.type === 4){
                  this.uploadProgress = 100;
                  this.uploading = false;
                } else if (data.type === 1) {
                  if(data.total !== undefined) {
                    this.uploadProgress = Math.round((100 * data.loaded) / data.total);
                  }
                }
              },
              error: (e) => {
                console.log(e.message);
                this.showMessage("Error Uploading the File....");
              },
              complete: () => {
                this.showMessage("File Successfully Uploaded!");
              }
            })
          this.uploading = false;
          this.uploadProgress = 0;
        };
        await delay(5000);

      }

    }
  }

  // Function to show the success message
  showMessage(message: string): void {
    this.successMessage = message;
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
  private processXml(jObj: any) {
    if (jObj.agentes && jObj.agentes.agente) {

      let agentes = jObj.agentes.agente;
      if (!Array.isArray(agentes)) {
        agentes = [agentes];
      }
      for (const agente of agentes) {
        if (agente.regiao) {
          const regioes = agente.regiao;

          // Loop through each <regiao> element
          for (const regiao of regioes) {
            if (regiao.precoMedio) {
              const valores = regiao.precoMedio.valor;

              for (let i = 0; i < valores.length; i++) {
                valores[i] = '******';
              }
            }
          }
        }
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
