import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePageSidebarComponent } from './home-page-sidebar.component';

describe('HomePageSidebarComponent', () => {
  let component: HomePageSidebarComponent;
  let fixture: ComponentFixture<HomePageSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePageSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
