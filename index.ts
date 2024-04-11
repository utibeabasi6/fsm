import { assign, createActor, fromPromise, setup } from 'xstate';
import { screenshotCid, ScreenShotObj } from './src/screenshotCid';
import 'dotenv/config'
import { saveToDisk } from './src/saveToDisk';
import { updateDatabase } from './src/updateDatabase';
import * as amqp from "amqplib";


function captureCidScreenShot(cid: string): Promise<ScreenShotObj> {
  return new Promise(async (resolve, reject) => {
    try {
      const screenShotObject = await screenshotCid(cid)
      resolve(screenShotObject)
    } catch (err) {
      reject(err)
    }
  })
}

const screenShotCidMachine = setup({
  types: {
    input: {} as { cid: string },
  },
  actors: {
    captureCidScreenShot: fromPromise(async ({ input }: { input: { cid: string } }) => {
      const screenShotObj = await captureCidScreenShot(input.cid);

      return screenShotObj;
    }),
    saveToDisk: fromPromise(async ({ input }: { input: { screenShotObject: ScreenShotObj } }) => {
      const fileName = await saveToDisk(input);
      return fileName
    }),
    updateDatabase: fromPromise(async ({ input }: { input: { fileName: string, key: string } }) => {
      await updateDatabase(input);
    })
  }
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwMYCcxgHYGUAWA9gC4DCAlhALICGKeZWYAdCtQA5ECuG5EO6mXISIBiCAUZMGANwIBrZqw7cwvfhmz5iAbQAMAXUSg2BWGSJkJRkAA9EAFnsBmJrre6AjAA4AnPYCsuk72AGwANCAAnohO-l5M-k4+ugDsKX4ATB72HikAvnkRqBpCxLw0dAyK7Fw8FOqCWqJgaGgEaExsADbURABm7QC2LDUqagKawnqGSCAmZhZWs3YIji7unr4BQaER0QgZuhlMGYGeuvYZIR4+HiEFRROlpBQV9JKw1NJgACoEACJkWByMQSZgyeTMT7fP6A4HTazzcyWLDWFY+EI+VwefwhEJZHGHLxePaIM4JFJebIZU7Zbz+fKFEDFRrCcq0d5Qr6-AFAkEtNodbq9AZoYbQnlwuQI2ZIxao5aIDFYzy4-EeQm6YmkhDBewnXypewpWKhLzOB7Mp5NdmVSScNgQXpgf69agAI2osDAoMkEIUTAdTqILrdnu9MuMpmRS1AK2yySYOJCTjuGScXnSKXsOoZWPsunxIRSeKcGR8vktLMmZVeHKqgcdztdRA9Xp9AvanR6-SGjeDodb4bAkbm0flaMQCd0SdxqfxGazOaiDi8ISYZapSQuxoCTir1rZdbtzD61DIXRUIgASgBRH7XgCao7lKMnCBxmaYKTOKSJPgzJxwhXBAqQSDYbmSdMU3sAomSwAgIDgaxq2eW1OURcc30VBAAFpgP2fCDxKG1j05EZlDqPhD2ITCFmwuMHAyHVvHiRJbl0PwywxJwTWI1layoesPm5WE+TomMFUYhAQl8E49SCTEaU4-wdVidcvAyLcrlTJI13uJlUNIoST37Zsw3bCSJxwjUAg3ZJi2CH8gN4nV7ArJg1xSG5MQLYt-H8fiaxeEzyNgTgUBQOB4FlLDY1sKdvJVZMfESTF0i1XM0lnfFsx8ZISypIK0LIhszwvFQrIYhKPyS7FcVSoCfAykkQIxBIzg8JwjlCJxggMgogA */
  id: "screenShotCidMachine",
  initial: "captureCidScreenShot",
  context: ({ input }) => ({
    cid: input.cid,
    screenShotObject: null,
    error: null
  }),
  states: {
    captureCidScreenShot: {
      invoke: {
        id: "captureCidScreenShot",
        src: "captureCidScreenShot",
        input: ({ context }) => ({ cid: context.cid }),
        onDone: {
          target: "saveToDisk",
          actions: assign({ screenShotObject: ({ event }) => event.output })
        },
        onError: {
          target: "failure",
          actions: assign({ error: ({ event }) => event.error })
        }
      }
    },
    saveToDisk: {
      invoke: {
        id: "saveToDisk",
        src: "saveToDisk",
        input: ({ context }) => ({ screenShotObject: context.screenShotObject }),
        onDone: {
          target: "updateDatabase",
          actions: assign({ fileName: ({ event }) => event.output })
        },
        onError: {

          target: "failure",
          actions: assign({ error: ({ event }) => event.error })
        }
      }
    },
    updateDatabase: {
      invoke: {
        id: "updateDatabase",
        src: "updateDatabase",
        input: ({ context }) => ({ fileName: context.fileName, key: context.screenShotObject.key }),
        onDone: {
          target: "success"
        },
        onError: {
          target: "failure",
          actions: assign({ error: ({ event }) => event.error })
        }
      }
    },
    success: {
      type: 'final',
    },
    failure: {
      on: {
        RETRY: { target: 'captureCidScreenShot' },
      },
    },
  },
});

async function startConsumption() {
  const conn = await amqp.connect('amqp://rabbitmq')

  const channel = await conn.createChannel()

  const queue = 'screenShotCid';

  channel.assertQueue(queue, {
    durable: false
  });

  console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
  channel.consume(queue, function (msg: any) {
    const screenShotCidMachineActor = createActor(screenShotCidMachine, {
      input: {
        cid: msg.content.toString()
      }
    })

    screenShotCidMachineActor.subscribe({
      next: (state) => {
        console.log(`Entering state ${state.value}`)
        if (state.context.error) {
          console.log(state.context.error)
        }
      },
      error: (err) => console.log(err),
    });

    screenShotCidMachineActor.start()
  }, {
    noAck: false
  });
}

let backoffLimit = 0

startConsumption()