import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemPageNavbarComponent } from './item-page-navbar.component';

describe('ItemPageNavbarComponent', () => {
  let component: ItemPageNavbarComponent;
  let fixture: ComponentFixture<ItemPageNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemPageNavbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemPageNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
