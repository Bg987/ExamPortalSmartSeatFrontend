import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowProblem } from './show-problem';

describe('ShowProblem', () => {
  let component: ShowProblem;
  let fixture: ComponentFixture<ShowProblem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowProblem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowProblem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
