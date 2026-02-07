import { resolveImageUrl } from '../../src/utils/images';

describe('resolveImageUrl (client-web)', () => {
  const originalLocation = window.location;
  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { origin: 'http://localhost:3002' };
    process.env.REACT_APP_API_URL = 'http://localhost:3000/api';
  });
  afterAll(() => {
    // @ts-ignore
    window.location = originalLocation;
  });

  test('returns absolute URLs unchanged', () => {
    const u = 'https://example.com/a.png';
    expect(resolveImageUrl(u)).toBe(u);
  });

  test('prefixes relative paths with API origin', () => {
    expect(resolveImageUrl('/uploads/x.webp')).toBe('http://localhost:3000/uploads/x.webp');
    expect(resolveImageUrl('uploads/y.webp')).toBe('http://localhost:3000/uploads/y.webp');
  });
});

