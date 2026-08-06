import { expect, test } from '@playwright/test';

test.use({
  permissions: ['camera', 'microphone'],
  launchOptions: {
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--allow-http-screen-capture',
      '--auto-select-desktop-capture-source=Entire screen',
      '--enable-usermedia-screen-capturing',
    ],
  },
});

test.describe('browser media devices', () => {

  test('camera and microphone produce live tracks and can be toggled', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const video = stream.getVideoTracks()[0];
      const audio = stream.getAudioTracks()[0];
      video.enabled = false;
      audio.enabled = false;
      const disabled = { video: video.enabled, audio: audio.enabled };
      video.enabled = true;
      audio.enabled = true;
      const output = {
        videoKind: video.kind,
        audioKind: audio.kind,
        videoState: video.readyState,
        audioState: audio.readyState,
        disabled,
        enabled: { video: video.enabled, audio: audio.enabled },
      };
      stream.getTracks().forEach((track) => track.stop());
      return output;
    });
    expect(result).toMatchObject({
      videoKind: 'video', audioKind: 'audio', videoState: 'live', audioState: 'live',
      disabled: { video: false, audio: false }, enabled: { video: true, audio: true },
    });
  });

  test('screen sharing returns a live video track', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
      if (!navigator.mediaDevices.getDisplayMedia) return { supported: false };
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = stream.getVideoTracks()[0];
      const output = { supported: true, kind: track?.kind, state: track?.readyState };
      stream.getTracks().forEach((item) => item.stop());
      return output;
    });
    expect(result).toEqual({ supported: true, kind: 'video', state: 'live' });
  });
});
