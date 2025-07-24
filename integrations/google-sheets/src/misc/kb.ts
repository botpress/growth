import * as bp from '.botpress'

const getAllFiles = async (client: bp.Client, tags: any) => {
  const allFiles: any[] = []
  let nextToken: string | undefined

  do {
    const response = await client.listFiles({
      tags,
      nextToken,
    })
    
    allFiles.push(...response.files)
    nextToken = response.meta.nextToken
  } while (nextToken)

  return allFiles
}

const logDeleteFileResults = (results: PromiseSettledResult<unknown>[], batchIndex?: number): void => {
  const failures = results.filter(r => r.status === 'rejected')
  
  const batchPrefix = batchIndex !== undefined ? `Batch ${batchIndex + 1}: ` : ''
  
  if (failures.length > 0) {
    console.error(`${batchPrefix}Failed to delete ${failures.length} files:`, 
      failures.map(f => (f as PromiseRejectedResult).reason))
  }
}

const tryDirectTagFiltering = async (kbId: string, client: bp.Client) => {
  try {
    const files = await getAllFiles(client, {
      kbId,
      origin: 'google-sheets',
    })
    return files
  } catch (error) {
    console.log('Direct tag filtering failed, falling back to two-step filtering:', error)
    return []
  }
}

const performTwoStepFiltering = async (kbId: string, client: bp.Client) => {
  const files = await getAllFiles(client, {
    kbId,
  })

  const filesToDelete = files.filter(file => file.tags.origin === 'google-sheets')
  console.log(`Filtered to ${filesToDelete.length} Google Sheets files`)
  
  return filesToDelete
}

export const deleteKbFiles = async (kbId: string, client: bp.Client): Promise<void> => {

  let filesToDelete = await tryDirectTagFiltering(kbId, client)
  
  const twoStepFiles = await performTwoStepFiltering(kbId, client)
  
  if (twoStepFiles.length > filesToDelete.length) {
    filesToDelete = twoStepFiles
  }
  
  if (filesToDelete.length === 0) {
    console.log('No Google Sheets files found to delete')
    return
  }

  console.log(`Preparing to delete ${filesToDelete.length} files`)

  const BATCH_SIZE = 50
  const shouldUseBatching = filesToDelete.length > BATCH_SIZE
  let allResults: PromiseSettledResult<unknown>[] = []

  if (shouldUseBatching) {
    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE)
      
      const batchResults = await Promise.allSettled(
        batch.map(file => client.deleteFile({ id: file.id }))
      )
      
      logDeleteFileResults(batchResults, i / BATCH_SIZE)
      allResults.push(...batchResults)
    }
  } else {
    allResults = await Promise.allSettled(
      filesToDelete.map(file => client.deleteFile({ id: file.id }))
    )
    logDeleteFileResults(allResults)
  }

  const totalSuccesses = allResults.filter(r => r.status === 'fulfilled').length
  const totalFailures = allResults.filter(r => r.status === 'rejected').length
  
  console.log(`File deletion completed: ${totalSuccesses} successes, ${totalFailures} failures`)
  
  if (totalFailures > 0) {
    const errorMessages = allResults
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason)
      .slice(0, 5)
    
    throw new Error(`Failed to delete ${totalFailures} out of ${filesToDelete.length} Google Sheets files. Sample errors: ${JSON.stringify(errorMessages)}`)
  }
}