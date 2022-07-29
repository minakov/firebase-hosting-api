import { GoogleAuth } from 'google-auth-library';
import * as fs from 'node:fs'
import * as zlib from 'zlib'

export interface Version {
    // The unique identifier for a version, in the format:
    // `sites/<site-name>/versions/<versionID>`
    name: string;
}

export interface UploadRequired {
    uploadUrl: string;
    uploadRequiredHashes: string[]
}

const ENDPOINT = 'https://firebasehosting.googleapis.com/v1beta1'

const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/firebase.hosting'
});

export async function createVersion(): Promise<string> {
    const client = await auth.getClient();
    const res = await client.request<Version>({
        method: 'POST',
        url: `${ENDPOINT}/sites/${process.env.SITE_ID}/versions`,
        body: JSON.stringify({}),
        responseType: 'json'
    });
    return res.data.name
}

export async function finalizeVersion(version: string): Promise<Version> {
    const client = await auth.getClient();
    const res = await client.request<Version>({
        method: 'PATCH',
        url: `${ENDPOINT}/${version}?update_mask=status`,
        body: JSON.stringify({ status: 'FINALIZED' }),
        responseType: 'json'
    });
    return res.data
}

export async function releaseVersion(version: string): Promise<Version> {
    const client = await auth.getClient();
    const res = await client.request<Version>({
        method: 'POST',
        url: `${ENDPOINT}/sites/${process.env.SITE_ID}/releases`,
        params: {
            versionName: version
        },
        body: JSON.stringify({}),
        responseType: 'json'
    });
    return res.data
}

export async function populateFiles(version: string, files: Record<string, string>): Promise<UploadRequired> {
    const client = await auth.getClient();
    const res = await client.request<UploadRequired>({
        method: 'POST',
        url: `${ENDPOINT}/${version}:populateFiles`,
        body: JSON.stringify({ files }),
        responseType: 'json'
    });
    return res.data
}

export async function uploadFile(url: string, hash: string, filePath: string): Promise<void> {
    const file = fs.createReadStream(filePath)
    const gzip = zlib.createGzip({ level: 9 })
    const client = await auth.getClient();
    const res = await client.request<void>({
        method: 'POST',
        url: `${url}/${hash}`,
        body: file.pipe(gzip),
        responseType: 'stream'
    });
    if (res.status !== 200) {
        throw new Error('Unexpected error while uploading file');
    }
}
