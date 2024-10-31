import { name } from './main';

describe('main', () => {
  test('name is exported', () => {
    expect(name).toEqual('template-ts');
  });
});
