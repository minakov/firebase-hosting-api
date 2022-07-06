import { initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as functions from "firebase-functions";

if (!getApps().length) {
  initializeApp()
}

export const deploy = functions.https.onRequest((request, response) => {
  functions.logger.info("deploy", { structuredData: true });
  const bucket = getStorage().bucket();
  response.send(bucket.name);
});
