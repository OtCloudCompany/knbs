import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtcloudDescriptionFieldComponent } from './otcloud-description-field.component';

describe('OtcloudDescriptionFieldComponent', () => {
  let component: OtcloudDescriptionFieldComponent;
  let fixture: ComponentFixture<OtcloudDescriptionFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtcloudDescriptionFieldComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtcloudDescriptionFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
