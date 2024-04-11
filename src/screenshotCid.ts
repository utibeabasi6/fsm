import chromium from '@sparticuz/chromium';
import { omit } from 'lodash';
import * as nanoid from 'nanoid';
import { chromium as playwright } from 'playwright-core';
import { createSignedRequest } from './createSignedRequest';

const defaultViewport = {
    width: 1440,
    height: 1080,
  } as const;

export  type ScreenShotObj = {
    key: string
    buffer: Buffer
  }

export async function screenshotCid(cid: string) : Promise<ScreenShotObj> {
    const browser = await playwright.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      });
      const page = await browser.newPage({ bypassCSP: true, colorScheme: 'dark' });
    
      await page.setViewportSize(defaultViewport);
    
      await page.route('**', (route) => {
        const requestInfo = route.request();
    
        const request = createSignedRequest({
          credentials: { accessKeyId: process.env.GATEWAY_ACCESS_KEY_ID!, secretAccessKey: process.env.GATEWAY_SECRET_ACCESS_KEY! },
          url: new URL(requestInfo.url()),
          method: 'GET',
          headers: requestInfo.headers(),
        });
    
        // If 'Host' was there, it would cause net::ERR_INVALID_ARGUMENT exception
        const headers = omit(request.headers, 'Host');
    
        route.continue({ headers });
      });
    
      await page.goto(`https://${cid}.ipfs.${process.env.IPFS_GATEWAY_HOSTNAME}`);
    
      const screenshotBuffer = await page.screenshot();
    
      await browser.close();
    
      const key = nanoid.nanoid(20);

      const response: ScreenShotObj = {
        buffer: screenshotBuffer,
        key
      }

      return response
}