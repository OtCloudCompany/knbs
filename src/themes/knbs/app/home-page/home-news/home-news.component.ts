import { Component } from '@angular/core';

import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';
import { ThemedSearchFormComponent } from 'src/app/shared/search-form/themed-search-form.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ds-themed-home-news',
  styleUrls: ['../../../../../app/home-page/home-news/home-news.component.scss'],
  templateUrl: './home-news.component.html',
  imports: [
    ThemedSearchFormComponent, TranslateModule
  ],
})
export class HomeNewsComponent extends BaseComponent {
}
