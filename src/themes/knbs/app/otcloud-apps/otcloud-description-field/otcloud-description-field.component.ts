import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { StripLineBreaksPipe } from '../strip-line-breaks.pipe';
import { ItemPageAbstractFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/abstract/item-page-abstract-field.component';
import { Item } from 'src/app/core/shared/item.model';

@Component({
  selector: 'ds-otcloud-description-field',
  imports: [
    TranslateModule,
    TruncatableComponent,
    TruncatablePartComponent,
    StripLineBreaksPipe
  ],
  templateUrl: './otcloud-description-field.component.html',
  styleUrl: './otcloud-description-field.component.scss',
})
export class OtcloudDescriptionFieldComponent extends ItemPageAbstractFieldComponent {
  // @Input() item: Item;
}
