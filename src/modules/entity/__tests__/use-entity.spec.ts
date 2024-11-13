import type { Mock } from 'vitest';
import { mockCrypto } from '../../../__tests__/tests.utils';
import { useEntity } from '../use-entity';

describe('useEntity', () => {
  const { create } = useEntity();

  let cryptoMock: { randomUUID: Mock };
  beforeEach(() => {
    cryptoMock = mockCrypto();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('returns the given payload with a new generated identifier', () => {
      const payload = { test: 'one' };
      expect(create(payload)).toEqual({ id: 'u-u-i-d-1', ...payload });
      expect(cryptoMock.randomUUID).toHaveBeenCalledOnce();
    });

    it("throws an error if the given payload already has a property 'id'", () => {
      const payload = { test: 'two', id: 2 };
      expect(() => create(payload)).toThrowError(
        "The given payload already has a property 'id'",
      );
      expect(cryptoMock.randomUUID).not.toHaveBeenCalled();
    });
  });
});
