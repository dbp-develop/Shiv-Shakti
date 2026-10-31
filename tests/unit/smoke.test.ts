import { describe, expect, it } from 'vitest';
import { App } from '../../src/app';

describe('smoke', () => {
  it('exports an App component', () => {
    expect(typeof App).toBe('function');
  });
});
