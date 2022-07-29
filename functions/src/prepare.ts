import { getStorage } from 'firebase-admin/storage';
import * as functions from "firebase-functions";

export const deploy = functions.https.onRequest(async (request, response) => {
  const bucket = getStorage().bucket();
  response.send(await bucket.name);
});
