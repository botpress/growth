import { tmpdir } from 'os'
import { join } from 'path'
import { createWriteStream, readFileSync } from 'fs'
import { mkdir, readdir, rm } from 'fs/promises'
import { extract } from 'tar'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import * as bp from '.botpress'

export default new bp.Integration({
  register: async () => {},
  unregister: async () => {},
  actions: {
    extractTgz: async ({ input, logger }) => {
      const tempDir = join(tmpdir(), uuidv4())
      await mkdir(tempDir, { recursive: true })

      const tgzFilePath = join(tempDir, 'file.tgz')

      // Download .tgz file
      const response = await axios.get(input.fileUrl, { responseType: 'stream' })
      const writer = createWriteStream(tgzFilePath)

      await new Promise((resolve, reject) => {
        response.data.pipe(writer)
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      // Extract .tgz file
      await extract({ file: tgzFilePath, cwd: tempDir })

      // Recursive function to list all files
      async function listFiles(dir: string): Promise<string[]> {
        const entries = await readdir(dir, { withFileTypes: true })
        const files = await Promise.all(
            entries.map((entry) => {
              const fullPath = join(dir, entry.name)
              return entry.isDirectory() ? listFiles(fullPath) : [fullPath]
            })
        )
        return files.flat()
      }

      const filePaths = await listFiles(tempDir)

      // Helper to detect binary content
      function isBinary(content: Buffer): boolean {
        const textChars = content.toString('utf8')
        return /[\x00-\x08\x0E-\x1F]/.test(textChars)
      }

      const files = filePaths
          .filter((name) => name !== tgzFilePath) // exclude original tgz file
          .map((fullPath) => {
            const contentBuffer = readFileSync(fullPath)
            const binary = isBinary(contentBuffer)

            return {
              fileName: fullPath.replace(`${tempDir}/`, ''),
              content: binary ? 'Binary File' : contentBuffer.toString('utf-8'),
            }
          })

      // Cleanup entire temp directory
      await rm(tempDir, { recursive: true, force: true })

      return { files }
    },
  },
  handler: async () => {},
  channels: {},
})
