import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainExam } from './main-exam';

describe('MainExam', () => {
  let component: MainExam;
  let fixture: ComponentFixture<MainExam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainExam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainExam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
