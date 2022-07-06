import { initializeApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import * as functions from "firebase-functions";
import { GoogleAuth } from 'google-auth-library';

if (!getApps().length) {
    initializeApp()
}

const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

export const deploy = functions.https.onRequest(async (request, response) => {
    const client = await auth.getClient();
    const res = await client.request({
        url: `https://firebasehosting.googleapis.com/v1beta1/sites/${process.env.SITE_ID}/versions`
    });

    const bucket = getStorage().bucket();
    functions.logger.info("deploy", bucket.name);

    response.send(await res.data);
});
