import * as functions from "firebase-functions";
import * as fs from 'node:fs'
import generate, { dir } from './generate'
import * as client from './client'
import * as path from 'path'

export const deploy = functions.https.onRequest(async (req, res) => {
  const files = await generate()
  let release: any = {};
  if (Object.keys(files).length) {
    const versionPath = await client.createVersion()
    const { uploadRequiredHashes, uploadUrl } = await client.populateFiles(versionPath, files)
    if (uploadRequiredHashes?.length) {
      const hashes = Object.entries(files).reduce<Record<string, string>>((result, [key, value]) => ({ ...result, [value]: key }), {})
      for (const hash of uploadRequiredHashes) {
        const filePath = hashes[hash]
        if (filePath) {
          await client.uploadFile(uploadUrl, hash, path.resolve(dir, filePath.substring(1)))
        }
      }
    }
    await client.finalizeVersion(versionPath)
    release = await client.releaseVersion(versionPath)
  }
  fs.rmSync(dir, { recursive: true, force: true })
  res.send(release)
})
