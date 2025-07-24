import * as bp from '.botpress'

export const deleteKbFiles = async (kbId: string, client: bp.Client): Promise<void> => {
  const { files } = await client.listFiles({
    tags: {
      kbId,
    },
  })

  const filesToDelete = files.filter(file => file.tags.origin === 'google-sheets')
  
  if (filesToDelete.length === 0) {
    return
  }

  const BATCH_SIZE = 50
  const shouldUseBatching = filesToDelete.length > BATCH_SIZE

  if (shouldUseBatching) {
    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        batch.map(file => client.deleteFile({ id: file.id }))
      )
    }
  } else {
    await Promise.allSettled(
      filesToDelete.map(file => client.deleteFile({ id: file.id }))
    )
  }
}