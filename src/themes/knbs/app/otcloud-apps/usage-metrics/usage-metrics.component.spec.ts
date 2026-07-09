import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageMetricsComponent } from './usage-metrics.component';

describe('UsageMetricsComponent', () => {
  let component: UsageMetricsComponent;
  let fixture: ComponentFixture<UsageMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageMetricsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
