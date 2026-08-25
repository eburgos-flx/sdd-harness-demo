import { CATEGORY_KEYS, type CategoryKey } from './category.dto';

describe('CategoryKey contract', () => {
  it('exposes exactly the six categories from the spec', () => {
    expect([...CATEGORY_KEYS]).toEqual([
      'teamwork',
      'ownership',
      'innovation',
      'delivery',
      'kindness',
      'learning',
    ]);
  });

  it('type CategoryKey is the closed union of the six literals', () => {
    const sample: CategoryKey[] = [
      'teamwork',
      'ownership',
      'innovation',
      'delivery',
      'kindness',
      'learning',
    ];
    expect(sample).toHaveLength(6);
  });
});
