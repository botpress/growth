import * as bp from '.botpress'

const logDeleteFileResults = (results: PromiseSettledResult<unknown>[], batchIndex?: number): void => {
  const successes = results.filter(r => r.status === 'fulfilled').length
  const failures = results.filter(r => r.status === 'rejected')
  
  const batchPrefix = batchIndex !== undefined ? `Batch ${batchIndex + 1}: ` : ''
  console.log(`${batchPrefix}Deleted ${successes} files successfully`)
  
  if (failures.length > 0) {
    console.error(`${batchPrefix}Failed to delete ${failures.length} files:`, 
      failures.map(f => (f as PromiseRejectedResult).reason))
  }
}

const tryDirectTagFiltering = async (kbId: string, client: bp.Client) => {
  try {
    const { files } = await client.listFiles({
      tags: {
        kbId,
        origin: 'google-sheets',
      },
    })
    console.log(`Direct tag filtering found ${files.length} Google Sheets files`)
    return files
  } catch (error) {
    console.log('Direct tag filtering failed, falling back to two-step filtering:', error)
    return []
  }
}

const performTwoStepFiltering = async (kbId: string, client: bp.Client) => {
  const { files } = await client.listFiles({
    tags: {
      kbId,
    },
  })
  
  console.log(`Found ${files.length} total files with kbId: ${kbId}`)
  
  const filesToDelete = files.filter(file => file.tags.origin === 'google-sheets')
  console.log(`Filtered to ${filesToDelete.length} Google Sheets files`)
  
  return filesToDelete
}

export const deleteKbFiles = async (kbId: string, client: bp.Client): Promise<void> => {
  console.log(`Starting deletion of Google Sheets files for kbId: ${kbId}`)
  
  let filesToDelete = await tryDirectTagFiltering(kbId, client)
  
  if (filesToDelete.length === 0) {
    filesToDelete = await performTwoStepFiltering(kbId, client)
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
    console.log(`Using batch processing with batch size ${BATCH_SIZE}`)
    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${i / BATCH_SIZE + 1} with ${batch.length} files`)
      
      const batchResults = await Promise.allSettled(
        batch.map(file => client.deleteFile({ id: file.id }))
      )
      
      logDeleteFileResults(batchResults, i / BATCH_SIZE)
      allResults.push(...batchResults)
    }
  } else {
    console.log('Processing all files in single batch')
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