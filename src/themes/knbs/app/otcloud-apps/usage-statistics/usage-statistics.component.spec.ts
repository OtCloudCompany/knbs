import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsageStatisticsComponent } from './usage-statistics.component';

describe('UsageStatisticsComponent', () => {
  let component: UsageStatisticsComponent;
  let fixture: ComponentFixture<UsageStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageStatisticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsageStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
