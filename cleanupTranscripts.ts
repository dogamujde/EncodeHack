import fs from "fs";
import path from "path";

interface FileInfo {
  name: string;
  baseName: string;
  extension: string;
}

function parseFileName(fileName: string): FileInfo {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);
  return {
    name: fileName,
    baseName,
    extension
  };
}

function findGenericDuplicates(validFiles: string[], mp3Files: { name: string; baseName: string; extension: string }[]): string[] {
  const duplicates: string[] = [];
  
  // Find all analysis files (both generic and specific)
  const analysisFiles = validFiles.filter(file => file.includes('analysis'));
  
  if (analysisFiles.length > 1 && mp3Files.length > 0) {
    // For a single MP3 file, all analysis files are duplicates of each other
    // We should keep only the best one (standardized naming + most recent)
    
    console.log(`🔍 Found ${analysisFiles.length} analysis files for the same MP3: ${analysisFiles.join(', ')}`);
    
    // Sort by preference: 1) Standardized naming, 2) Most recent time
    const stats = analysisFiles.map(file => ({
      file,
      mtime: fs.statSync(file).mtime,
      isStandardized: file.includes('___'), // Prefer standardized naming
      isGeneric: file === 'speaker_analysis.json' || file === 'two_speaker_analysis.json'
    }));
    
    // Sort by: 1) Standardized naming preference, 2) Most recent time, 3) Less generic
    stats.sort((a, b) => {
      // First priority: standardized naming
      if (a.isStandardized !== b.isStandardized) {
        return b.isStandardized ? 1 : -1;
      }
      // Second priority: most recent
      if (Math.abs(a.mtime.getTime() - b.mtime.getTime()) > 1000) { // More than 1 second difference
        return b.mtime.getTime() - a.mtime.getTime();
      }
      // Third priority: less generic naming
      if (a.isGeneric !== b.isGeneric) {
        return a.isGeneric ? 1 : -1;
      }
      return 0;
    });
    
    // Keep the first (best) file, mark others for deletion
    for (let i = 1; i < stats.length; i++) {
      duplicates.push(stats[i].file);
      console.log(`   🗑️ Will delete: ${stats[i].file} (${stats[i].isStandardized ? 'standardized but older' : 'generic naming'})`);
    }
    console.log(`   ✅ Will keep: ${stats[0].file} (${stats[0].isStandardized ? 'standardized naming' : stats[0].isGeneric ? 'generic but newest' : 'specific naming'})`);
  }

  return duplicates;
}

function cleanupTranscripts() {
  console.log("🧹 Starting transcript cleanup...");
  
  try {
    // Get all files in current directory
    const allFiles = fs.readdirSync('.');
    
    // Identify MP3 files
    const mp3Files = allFiles
      .filter(file => file.endsWith('.mp3'))
      .map(parseFileName);
    
    console.log(`🎵 Found ${mp3Files.length} MP3 files:`);
    mp3Files.forEach(file => console.log(`   - ${file.name}`));
    
    // Identify transcript JSON files (various patterns)
    const transcriptPatterns = [
      /transcript\.json$/,
      /enhanced_transcript\.json$/,
      /two_speaker_transcript\.json$/,
      /_transcript\.json$/,
      /_analysis\.json$/,
      /speaker_analysis\.json$/,
      /two_speaker_analysis\.json$/
    ];
    
    const jsonFiles = allFiles.filter(file => 
      transcriptPatterns.some(pattern => pattern.test(file))
    );
    
    console.log(`\n📄 Found ${jsonFiles.length} transcript/analysis JSON files:`);
    jsonFiles.forEach(file => console.log(`   - ${file}`));
    
    // Check which JSON files have corresponding MP3 files
    const orphanedFiles: string[] = [];
    const validFiles: string[] = [];
    
    for (const jsonFile of jsonFiles) {
      // Special handling for generic names
      if (['transcript.json', 'enhanced_transcript.json', 'two_speaker_transcript.json'].includes(jsonFile)) {
        // These are generic names - keep if there's at least one MP3
        if (mp3Files.length > 0) {
          validFiles.push(jsonFile);
          continue;
        } else {
          orphanedFiles.push(jsonFile);
          continue;
        }
      }
      
      // For analysis files, check if they correspond to any MP3
      if (jsonFile.includes('_analysis.json') || jsonFile.includes('speaker_analysis.json')) {
        // Extract potential MP3 name from analysis file
        let analysisBaseName = jsonFile
          .replace('_two_speaker_analysis.json', '')
          .replace('_enhanced_analysis.json', '')
          .replace('_analysis.json', '')
          .replace('_speaker_analysis.json', '')
          .replace('speaker_analysis.json', '')
          .replace('two_speaker_analysis.json', '');
        
        // Clean the base name (same logic as standardizeTranscriptName)
        analysisBaseName = analysisBaseName
          .replace(/[^a-zA-Z0-9\-_\s]/g, '') 
          .replace(/\s+/g, '_') 
          .toLowerCase();
        
        // Check if corresponding MP3 exists
        let hasCorrespondingMp3 = false;
        
        // For generic analysis files (without specific base names)
        if (analysisBaseName === '' || analysisBaseName === 'speaker' || analysisBaseName === 'two_speaker') {
          hasCorrespondingMp3 = mp3Files.length > 0; // Keep if there's any MP3
        } else {
          // For specific analysis files, find exact MP3 match
          hasCorrespondingMp3 = mp3Files.some(mp3 => {
            const cleanMp3BaseName = mp3.baseName
              .replace(/[^a-zA-Z0-9\-_\s]/g, '')
              .replace(/\s+/g, '_')
              .toLowerCase();
            return cleanMp3BaseName === analysisBaseName;
          });
        }
        
        if (hasCorrespondingMp3) {
          validFiles.push(jsonFile);
        } else {
          orphanedFiles.push(jsonFile);
        }
      } else {
        // For other transcript files, try to match by base name
        let jsonBaseName = jsonFile
          .replace('_two_speaker_transcript.json', '')
          .replace('_enhanced_transcript.json', '')
          .replace('_transcript.json', '')
          .replace('_enhanced.json', '')
          .replace('.json', '');
        
        // Clean the base name (same logic as standardizeTranscriptName)
        jsonBaseName = jsonBaseName
          .replace(/[^a-zA-Z0-9\-_\s]/g, '')
          .replace(/\s+/g, '_')
          .toLowerCase();
        
        // Check if corresponding MP3 exists
        let hasCorrespondingMp3 = false;
        
        // For generic transcript files
        if (jsonBaseName === '' || jsonBaseName === 'transcript' || jsonBaseName === 'enhanced_transcript' || jsonBaseName === 'two_speaker_transcript') {
          hasCorrespondingMp3 = mp3Files.length > 0; // Keep if there's any MP3
        } else {
          // For specific transcript files, find exact MP3 match
          hasCorrespondingMp3 = mp3Files.some(mp3 => {
            const cleanMp3BaseName = mp3.baseName
              .replace(/[^a-zA-Z0-9\-_\s]/g, '')
              .replace(/\s+/g, '_')
              .toLowerCase();
            return cleanMp3BaseName === jsonBaseName;
          });
        }
        
        if (hasCorrespondingMp3) {
          validFiles.push(jsonFile);
        } else {
          orphanedFiles.push(jsonFile);
        }
      }
    }
    
    // Handle duplicate generic files (keep only the most recent)
    const genericDuplicates = findGenericDuplicates(validFiles, mp3Files);
    if (genericDuplicates.length > 0) {
      console.log(`\n🔍 Found duplicate files, keeping only the best one:`);
      for (const duplicate of genericDuplicates) {
        orphanedFiles.push(duplicate);
        validFiles.splice(validFiles.indexOf(duplicate), 1);
        console.log(`   🗑️ Marking for deletion (duplicate): ${duplicate}`);
      }
    }

    // Display results
    console.log(`\n✅ Valid JSON files (${validFiles.length}):`);
    validFiles.forEach(file => console.log(`   ✓ ${file}`));
    
    console.log(`\n🗑️  Orphaned JSON files to delete (${orphanedFiles.length}):`);
    orphanedFiles.forEach(file => console.log(`   ❌ ${file}`));
    
    // Delete orphaned files
    if (orphanedFiles.length > 0) {
      console.log(`\n🧹 Deleting ${orphanedFiles.length} orphaned files...`);
      
      let deletedCount = 0;
      for (const file of orphanedFiles) {
        try {
          fs.unlinkSync(file);
          console.log(`   ✅ Deleted: ${file}`);
          deletedCount++;
        } catch (error) {
          console.error(`   ❌ Failed to delete ${file}:`, error);
        }
      }
      
      console.log(`\n🎉 Cleanup complete! Deleted ${deletedCount} orphaned files.`);
    } else {
      console.log("\n✨ No orphaned files found. Directory is already clean!");
    }
    
    // Storage optimization summary
    const remainingJsonFiles = validFiles.length;
    const remainingMp3Files = mp3Files.length;
    
    console.log(`\n📊 CLEANUP SUMMARY:`);
    console.log(`   🎵 MP3 files: ${remainingMp3Files}`);
    console.log(`   📄 JSON files: ${remainingJsonFiles}`);
    console.log(`   🗑️  Files deleted: ${orphanedFiles.length}`);
    console.log(`   💾 Storage optimized: ${orphanedFiles.length > 0 ? 'Yes' : 'Already optimal'}`);
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  }
}

// Also create a function to standardize transcript naming
function standardizeTranscriptName(mp3FileName: string, transcriptType: 'basic' | 'enhanced' | 'two_speaker' = 'basic'): string {
  const baseName = path.basename(mp3FileName, path.extname(mp3FileName));
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9\-_\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();
  
  switch (transcriptType) {
    case 'enhanced':
      return `${cleanBaseName}_enhanced_transcript.json`;
    case 'two_speaker':
      return `${cleanBaseName}_two_speaker_transcript.json`;
    default:
      return `${cleanBaseName}_transcript.json`;
  }
}

// Function to get analysis file name
function getAnalysisFileName(mp3FileName: string, analysisType: 'basic' | 'enhanced' | 'two_speaker' = 'basic'): string {
  const baseName = path.basename(mp3FileName, path.extname(mp3FileName));
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  switch (analysisType) {
    case 'enhanced':
      return `${cleanBaseName}_enhanced_analysis.json`;
    case 'two_speaker':
      return `${cleanBaseName}_two_speaker_analysis.json`;
    default:
      return `${cleanBaseName}_analysis.json`;
  }
}

// Auto-cleanup function that can be called by other scripts
function autoCleanup() {
  console.log("🤖 Running auto-cleanup...");
  cleanupTranscripts();
}

// Run if called directly
if (require.main === module) {
  cleanupTranscripts();
}

export { 
  cleanupTranscripts, 
  autoCleanup, 
  standardizeTranscriptName, 
  getAnalysisFileName 
}; 