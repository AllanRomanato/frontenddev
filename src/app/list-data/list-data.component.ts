import { Component } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-list-data',
  templateUrl: './list-data.component.html',
  styleUrls: ['./list-data.component.css']
})
export class ListDataComponent {
  data: any[] = [];
  jsonData: any = '';

  displayedColumns: string[] = ['codigoAgente','valorCompra', 'valorGeracao'];

  constructor(private http: HttpClient){}
  ngOnInit() {

  }

  onClick() {
    //Load from backend
    this.http.get<any>('http://localhost:8080/api/v1/retrieve-data')
      .subscribe({
        next: (data) => {
          this.jsonData = data;
          console.log(this.jsonData.N[0]);

        },
        error: (e) => {
          console.log(e.message);
        }
      })
  }

  protected readonly Object = Object;
}
