import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignedOrders } from './assigned-orders';

describe('AssignedOrders', () => {
  let component: AssignedOrders;
  let fixture: ComponentFixture<AssignedOrders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignedOrders],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignedOrders);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
