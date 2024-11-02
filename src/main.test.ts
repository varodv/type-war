import { createApp } from 'vue';
import App from './App.vue';
import './main';

vi.mock('vue', () => {
  return {
    createApp: vi.fn().mockReturnValue({
      mount: vi.fn(),
    }),
  };
});

describe('main', () => {
  it('should mount the app', () => {
    expect(createApp).toHaveBeenCalledWith(App);
    expect(createApp().mount).toHaveBeenCalledWith('#app');
  });
});
