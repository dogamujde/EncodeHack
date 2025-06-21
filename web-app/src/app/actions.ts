'use server'

import { promises as fs } from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'

export async function deleteRecording(filename: string) {
  const recordingsDir = path.join(process.cwd(), '..', 'recordings')
  const filePath = path.join(recordingsDir, filename)
  try {
    await fs.unlink(filePath)
    console.log(`Deleted recording: ${filename}`)
    revalidatePath('/meetings') // Revalidate the meetings page
  } catch (error) {
    console.error(`Error deleting recording ${filename}:`, error)
    throw new Error('Failed to delete recording.')
  }
} 