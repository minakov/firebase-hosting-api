import { getStorage } from 'firebase-admin/storage';
import * as functions from "firebase-functions";
import { GoogleAuth } from 'google-auth-library';
import * as crypto from "crypto";
import { Readable } from "stream";
import * as zlib from "zlib";

const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

export const deploy = functions.https.onRequest(async (request, response) => {
    const page = 'qwerty';
    new Promise((resolve, reject) => {
        const hash = crypto.createHash("sha256");
        const stream = Readable.from([page])
        .pipe(zlib.createGzip({ level: 9 }))
        .pipe(hash);
        stream.on("end", () => {
            const hex = hash.read().toString("hex");
            resolve(hex)
        });
        stream.on("error", reject);
    });

    const client = await auth.getClient();
    const res = await client.request({
        url: `https://firebasehosting.googleapis.com/v1beta1/sites/${process.env.SITE_ID}/versions`
    });

    const bucket = getStorage().bucket();
    functions.logger.info("deploy", bucket.name);

    response.send(await res.data);
});
