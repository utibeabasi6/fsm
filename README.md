# FSM POC

This repository contains the code for a proof of concept on using xstate as a step functions alternative

## How to run

- Clone the repo
- A .env template has been provided so fill in the respective values from Doppler
- Start the consumer by running `docker compose up` 
- Start the sender by running `pnpm send` in a separate shell. This will prompt you to input a cid. The service sends the cid to rabbitmq and the consumer runs the statemachine using the cid as the input
- You should see the website screenshot in the images folder
- You should also see the steps the state maching is running in the docker logs