import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitationGeneratorComponent } from './citation-generator.component';

describe('CitationGeneratorComponent', () => {
  let component: CitationGeneratorComponent;
  let fixture: ComponentFixture<CitationGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitationGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitationGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
