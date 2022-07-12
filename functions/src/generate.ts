import * as functions from "firebase-functions";
// @ts-ignore
import { Nuxt, getGenerator } from 'nuxt'
import { NuxtConfig } from '@nuxt/types'
import * as fs from 'node:fs'
import * as crypto from 'crypto'
import * as os from 'os'
import * as path from 'path'
import { sync } from "glob"
import * as zlib from "zlib"

const dir = path.join(os.tmpdir(), `nuxt-dist-${crypto.randomBytes(20).toString('hex')}`)

const config: NuxtConfig = {
  buildDir: '../nuxt/.nuxt',
  generate: {
    dir,
  },
  dev: false,
  debug: true,
  _start: true
}
const nuxt = new Nuxt(config)

export const generate = functions.https.onRequest(async (req, res) => {
  const generator = await getGenerator(nuxt)
  await generator.generate({ build: false })

  const hashMap: Record<string, string> = {};

  const files = sync("**/*", {
    cwd: dir,
    dot: true,
    follow: true,
    nodir: true,
    nosort: true,
  })
  for (const filePath of files) {
    const hex = await new Promise<string>(function (resolve, reject) {
      const hash = crypto.createHash('sha256').setEncoding('hex')
      fs.createReadStream(path.resolve(dir, filePath))
        .once('error', reject)
        .pipe(zlib.createGzip({ level: 9 }))
        .pipe(hash)
        .once('finish', function () {
          resolve(hash.read());
        });
    });
    hashMap[hex] = filePath
  }

  fs.rmSync(dir, { recursive: true, force: true })
  res.send(hashMap)
})
