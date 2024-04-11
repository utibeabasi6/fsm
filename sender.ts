import * as readline from 'readline';
import * as amqp from "amqplib";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getUserInput() {
  rl.question('Please enter a CID (or type "exit" to quit): ', async (input: string) => {
    if (input.toLowerCase() === 'exit') {
      rl.close();
    }
    
    const conn = await amqp.connect('amqp://localhost')

    const channel = await conn.createChannel() 
    const queue = 'screenShotCid';

    channel.assertQueue(queue, {
      durable: false
    });

    channel.sendToQueue(queue, Buffer.from(input));
    console.log(" [x] Sent %s", input);
    getUserInput()
  });
};


getUserInput()
rl.on('close', () => {
  console.log('Exiting program...');
  process.exit(0);
});