import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationTracker } from './location-tracker';

describe('LocationTracker', () => {
  let component: LocationTracker;
  let fixture: ComponentFixture<LocationTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationTracker],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
