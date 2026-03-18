import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetExam } from './get-exam';

describe('GetExam', () => {
  let component: GetExam;
  let fixture: ComponentFixture<GetExam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetExam]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetExam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
