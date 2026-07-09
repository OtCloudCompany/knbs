import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtcloudAbstractFieldComponent } from './otcloud-abstract-field.component';

describe('OtcloudAbstractFieldComponent', () => {
  let component: OtcloudAbstractFieldComponent;
  let fixture: ComponentFixture<OtcloudAbstractFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtcloudAbstractFieldComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OtcloudAbstractFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
