import {
  AUTH_PLACEMENT_ROUTES,
  STUDENT_PLACEMENT_ROUTES,
  placementRoutesFor,
} from '../placementRoutes';

describe('placementRoutesFor', () => {
  it('học viên đã đăng nhập dùng route trong (student)', () => {
    expect(placementRoutesFor('(student)')).toBe(STUDENT_PLACEMENT_ROUTES);
  });

  it.each(['(auth)', undefined, null, ''])('nhóm %p dùng route (auth) cho khách', (seg) => {
    expect(placementRoutesFor(seg as string | null | undefined)).toBe(AUTH_PLACEMENT_ROUTES);
  });

  it('các route (student) khớp file trong app/(student)/placement', () => {
    expect(STUDENT_PLACEMENT_ROUTES).toEqual({
      intro: '/(student)/placement',
      test: '/(student)/placement/test',
      result: '/(student)/placement/result',
    });
  });
});
