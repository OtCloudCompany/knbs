import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TruncatableComponent } from 'src/app/shared/truncatable/truncatable.component';
import { TruncatablePartComponent } from 'src/app/shared/truncatable/truncatable-part/truncatable-part.component';
import { StripLineBreaksPipe } from '../strip-line-breaks.pipe';
import { ItemPageAbstractFieldComponent } from 'src/app/item-page/simple/field-components/specific-field/abstract/item-page-abstract-field.component';

@Component({
  selector: 'ds-otcloud-abstract-field',
  imports: [CommonModule,
    TranslateModule,
    TruncatableComponent,
    TruncatablePartComponent,
    StripLineBreaksPipe
  ],
  templateUrl: './otcloud-abstract-field.component.html',
  styleUrl: './otcloud-abstract-field.component.scss',
})
export class OtcloudAbstractFieldComponent extends ItemPageAbstractFieldComponent {

}
