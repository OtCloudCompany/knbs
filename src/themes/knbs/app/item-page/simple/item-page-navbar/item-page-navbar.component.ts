import { Component, OnInit, Input } from '@angular/core';
import { DSpaceObject } from 'src/app/core/shared/dspace-object.model';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ds-item-page-navbar',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './item-page-navbar.component.html',
  styleUrl: './item-page-navbar.component.scss',
})
export class ItemPageNavbarComponent implements OnInit {
  @Input() item: DSpaceObject;
  handle: string;
  title: string;

  ngOnInit() {
    if (this.item.hasMetadata(['dc.identifier.uri'])) {
      this.handle = this.item.firstMetadataValue('dc.identifier.uri') || '';
    }
    if (this.item.hasMetadata(['dc.title'])) {
      this.title = this.item.firstMetadataValue('dc.title') || '';
    }
  }
}
