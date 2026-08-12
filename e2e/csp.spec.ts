import { test, expect } from '@playwright/test';

const REPLACEMENTS =
  'https://e621.net/post_replacements?search%5Bpost_id%5D=6565379';

interface Violation {
  directive: string;
  blocked: string;
}

interface Probes {
  violations: Violation[];
  canvas: string;
  imgData: string;
  imgBlob: string;
  videoBlob: string;
  videoRemote: string;
  videoError: string;
  videoFrame: string;
  videoReplacement: string;
}

// e621's edge sometimes serves a certificate chain without the intermediate.
test.use({ ignoreHTTPSErrors: true });

test.describe('e621 CSP', () => {
  test('decides what the heatmap may render', async ({ page }) => {
    test.setTimeout(90_000);

    const response = await page.goto(REPLACEMENTS, {
      waitUntil: 'domcontentloaded',
    });
    const csp = response?.headers()['content-security-policy'] ?? '';
    expect(csp, 'page served no CSP').not.toBe('');

    const probes = await page.evaluate<Probes>(async () => {
      const violations: Violation[] = [];
      document.addEventListener('securitypolicyviolation', (event) => {
        violations.push({
          directive: event.effectiveDirective,
          blocked: event.blockedURI,
        });
      });

      function settle(
        el: HTMLImageElement | HTMLVideoElement,
        src: string,
        ms: number,
      ): Promise<string> {
        return new Promise((resolve) => {
          const timer = setTimeout(() => resolve('timeout'), ms);
          const done = (outcome: string) => {
            clearTimeout(timer);
            resolve(outcome);
          };
          el.addEventListener('error', () => done('error'));
          el.addEventListener(
            el instanceof HTMLVideoElement ? 'loadeddata' : 'load',
            () => done('loaded'),
          );
          el.src = src;
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 4;
      const ctx = canvas.getContext('2d')!;
      const painted = new ImageData(4, 4);
      painted.data.fill(200);
      ctx.putImageData(painted, 0, 0);
      const readback = ctx.getImageData(0, 0, 1, 1).data[3];

      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve),
      );

      const imgBlob = await settle(
        new Image(),
        URL.createObjectURL(png!),
        5000,
      );
      const imgData = await settle(new Image(), canvas.toDataURL(), 5000);

      const videoBlob = await settle(
        document.createElement('video'),
        URL.createObjectURL(
          new Blob([new Uint8Array(8)], { type: 'video/mp4' }),
        ),
        5000,
      );

      const post = (await fetch('/posts/6565379.json', {
        headers: { Accept: 'application/json' },
      }).then((res) => res.json())) as { post: { file: { url: string } } };

      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'auto';
      const videoRemote = await settle(video, post.post.file.url, 30_000);
      const videoError = video.error
        ? `${video.error.code}: ${video.error.message}`
        : '';

      let videoFrame = 'unreached';
      if (videoRemote === 'loaded') {
        const frame = document.createElement('canvas');
        frame.width = 8;
        frame.height = 8;
        const fx = frame.getContext('2d')!;
        fx.drawImage(video, 0, 0, 8, 8);
        try {
          fx.getImageData(0, 0, 1, 1);
          videoFrame = 'readable';
        } catch {
          videoFrame = 'tainted';
        }
      }

      const thumb = document.querySelector<HTMLImageElement>(
        '.replacement-card[id^="replacement-"]:not(.is-current) img.replacement-thumb',
      );
      const file = thumb?.closest('a')?.getAttribute('href');
      const videoReplacement = file
        ? await settle(document.createElement('video'), file, 30_000)
        : 'no file link';

      return {
        violations,
        videoReplacement,
        canvas: readback === 200 ? 'painted' : 'blank',
        imgData,
        imgBlob,
        videoBlob,
        videoRemote,
        videoError,
        videoFrame,
      };
    });

    const blocked = (directive: string) =>
      probes.violations.some((entry) => entry.directive === directive);

    console.log(JSON.stringify(probes, null, 2));

    const directive = (name: string) =>
      csp
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name} `)) ?? '';
    expect(directive('img-src'), 'img-src').not.toContain('blob:');
    expect(directive('media-src'), 'media-src').not.toContain('blob:');
    expect(probes.canvas, 'putImageData on a mounted canvas').toBe('painted');
    expect(probes.imgData, 'data: image').toBe('loaded');
    expect(probes.imgBlob, 'blob: image').toBe('error');
    expect(blocked('img-src'), 'blob: image blocked by img-src').toBe(true);
    expect(probes.videoBlob, 'blob: video').toBe('error');
    expect(blocked('media-src'), 'blob: video blocked by media-src').toBe(true);
    if (probes.videoRemote === 'loaded') {
      expect(probes.videoFrame, 'frame drawn from a static1 video').toBe(
        'tainted',
      );
    } else {
      test.info().annotations.push({
        type: 'undecodable',
        description: `static1 video: ${probes.videoError}`,
      });
    }
  });
});
