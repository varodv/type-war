export function mockCrypto() {
  let uuidCounter = 0;
  const cryptoMock = {
    randomUUID: vi.fn().mockImplementation(() => `u-u-i-d-${++uuidCounter}`),
  };
  vi.stubGlobal('crypto', cryptoMock);
  return cryptoMock;
}
