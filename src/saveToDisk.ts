import * as fs from 'fs'
import { ScreenShotObj } from './screenshotCid';

export function saveToDisk({ screenShotObject }: { screenShotObject: ScreenShotObj }) {
    return new Promise((resolve, reject) => {
      const fileName = `images/${screenShotObject.key}.png`
      try {
        // Ensure images directory exists
        if (!fs.existsSync("images")) {
          fs.mkdirSync("images");
        }
  
        fs.writeFileSync(fileName, screenShotObject.buffer);
        resolve(fileName)
      } catch (error: any) {
        reject(error)
      }
    })
  }