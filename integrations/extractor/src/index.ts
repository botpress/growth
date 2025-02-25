import { tmpdir } from 'os'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { mkdir, readdir, rm } from 'fs/promises'
import { extract } from 'tar'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    extractTgz: async ({ input }) => {
      const tempDir = join(tmpdir(), uuidv4())
      await mkdir(tempDir, { recursive: true })

      const tgzFilePath = join(tempDir, 'file.tgz')

      // Download file first, because streams are less reliable in Lambda
      const response = await axios.get(input.fileUrl, { responseType: 'stream' })
      const writer = createWriteStream(tgzFilePath)

      await new Promise((resolve, reject) => {
        response.data.pipe(writer)
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      // Extract downloaded tgz
      await extract({ file: tgzFilePath, cwd: tempDir })

      // List extracted files
      const files = await readdir(tempDir, { recursive: true })


      // Cleanup downloaded file to save space
      await rm(tgzFilePath, { force: true })

      return { files }
    },
  },
  handler: async () => {},
  channels: {},
})
