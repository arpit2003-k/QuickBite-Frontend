import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantApproval } from './restaurant-approval';

describe('RestaurantApproval', () => {
  let component: RestaurantApproval;
  let fixture: ComponentFixture<RestaurantApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(RestaurantApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
