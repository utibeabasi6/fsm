import { assign, createActor, fromPromise, setup } from 'xstate';
import screenshotCid  from './src/screenshotCid';

function captureCidScreenShot(cid: string)  {
  return new Promise(async (resolve, reject) => {
    try {
      const key = await screenshotCid(cid)
      console.log(key)
      resolve(key)
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

function updateDeployment({cid}: {cid: string})  {
  return new Promise((resolve, _) => {
    resolve("updated")
  })
}

const screenShotCidMachine = setup({
  types: {
    input: {} as {cid: string}
  },
  actors: {
    captureCidScreenShot: fromPromise(async ({ input }: { input: { cid: string }}) => {
      const key = await captureCidScreenShot(input.cid);
      
      return key;
    }),
    updateDeployment: fromPromise(async ({input}: {input: {cid: string}}) => {
      await updateDeployment(input);
    })
  }
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwMYCcxgHYGUAWA9gC4DCAlhALICGKeZWYAdCtQA5ECuG5EO6mXISIBiCAUZMGANwIBrZqw7cwvfhmz5iAbQAMAXUSg2BWGSJkJRkAA9EAFgCsAZia737+8+8AOAJw+zo4ANCAAnoiBTABMAOzO9gCMuonRurG6-rEAvtmhqBpCxLw0dAyK7Fw8FOqCWqJgaGgEaExsADbURABmLQC2LJUqagKawnqGSCAmZhZWU3YITq4ent7O-oEh4YjOAGx+TPZ+Jy5ePsl+9rn5o0WkFKX0kpxsEF1gACJgHQRhfdhROJJDJ5MxXu8iF8fu0-gCsEQJtYZuZLFhrItkrFDn5ool-E5Yv4NqEIgg-IkmLFjgFnIlEs4UntEjcQAU6sISrRnuC3h9vr9-oCRI1mq0Ol1emgBhD+TC4YCkVMUXN0QtEFicXiCY4iX4STsEAzDtEabFotE9ozdBTrnk2Xd6lyypJutQyO0VCIAEoAUQAKt6AJpK4ymVHzUCYxJXI4+c4+RzHPbm7Zk02xGI0xw+aKOenOK45VlYAgQODWdljYqPbnlZHh1UYxAAWj2pNbezcqx8GV7Pn8ltZVfuzp5g2U1T4juEDdmaObS2iHfJh2c1L8GWplqLe2HM5rVDrLz5UIFsKFCLnEbVUcQGUpeY89j2Tj2A78K4uRxOAROe0cPxdRzfdCidWsXWYWBOBQFA4HgZVGwXdUjUZLtElifE-F0exdGiXEgi-Q4aQpAj6QwmNQI5Q8nnKJg3Q9FRrybFCGV0dDMP8HC8IItNEAzKls1zfNjUcXJciAA */
  id: "screenShotCidMachine",
  initial: "captureCidScreenShot",
  context: ({ input }) => ({
    cid: input.cid
  }),
  states: {
    captureCidScreenShot: {
      invoke: {
        id: "captureCidScreenShot",
        src: "captureCidScreenShot",
        input: ({context}) => ({cid: context.cid}),
        onDone: {
          target: "updateDeployment",
          actions: assign({cid: ({event}) => event.output as string})
        },
        onError: {
          target: "failure",
        }
      }
    },
    updateDeployment: {
      invoke: {
        id: "updateDeployment",
        src: "updateDeployment",
        input: {
          cid: ""
        },
        onDone: {
          target: "success"
        },
        onError: {
          target: "failure",
        }
      }
    },
    success: {
      type: 'final'
    },
    failure: {
      on: {
        RETRY: { target: 'captureCidScreenShot' },
      },
    },
  }
});



const screenShotCidMachineActor = createActor(screenShotCidMachine, {input: {
  cid: "test"
}})

screenShotCidMachineActor.subscribe((state) => console.log(state.value, state.context, state.error));
screenShotCidMachineActor.start()

