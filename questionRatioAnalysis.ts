import fs from "fs";
import path from "path";

interface Word {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
}

interface Utterance {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker: string;
  words: Word[];
}

interface Question {
  text: string;
  speaker: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'OPEN_ENDED' | 'CLOSED_ENDED' | 'LEADING' | 'CLARIFYING' | 'FOLLOW_UP' | 'RHETORICAL';
  category: 'WH_QUESTION' | 'YES_NO' | 'CHOICE' | 'TAG' | 'INDIRECT' | 'STATEMENT_QUESTION';
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  confidence: number;
}

interface Statement {
  text: string;
  speaker: string;
  startTime: number;
  endTime: number;
  duration: number;
  type: 'DECLARATIVE' | 'RESPONSE' | 'EXPLANATION' | 'OPINION';
}

interface SpeakerQuestionPattern {
  speaker: string;
  totalUtterances: number;
  questionCount: number;
  statementCount: number;
  questionRatio: number; // questions / total utterances
  questionToStatementRatio: number; // questions / statements
  averageQuestionLength: number;
  questionTypes: Record<string, number>;
  questionCategories: Record<string, number>;
  questionComplexity: Record<string, number>;
  longestQuestion?: Question;
  shortestQuestion?: Question;
  mostComplexQuestion?: Question;
}

interface ConversationDynamics {
  totalQuestions: number;
  totalStatements: number;
  overallQuestionRatio: number;
  questionBalance: number; // How balanced are questions between speakers (0-100, 100 = perfectly balanced)
  questionDensity: number; // Questions per minute
  averageQuestionLength: number;
  averageStatementLength: number;
  questionClusters: Array<{
    startTime: number;
    endTime: number;
    questionCount: number;
    speaker: string;
  }>;
}

interface QuestionRatioAnalysis {
  totalDuration: number;
  questions: Question[];
  statements: Statement[];
  speakerPatterns: Record<string, SpeakerQuestionPattern>;
  conversationDynamics: ConversationDynamics;
  insights: string[];
}

function identifyQuestionType(text: string): { type: Question['type']; category: Question['category']; complexity: Question['complexity'] } {
  const lowerText = text.toLowerCase().trim();
  
  // Question indicators
  const whWords = ['what', 'where', 'when', 'who', 'whom', 'whose', 'why', 'which', 'how'];
  const yesNoStarters = ['do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'shall', 'may', 'might', 'is', 'are', 'was', 'were', 'have', 'has', 'had'];
  const tagEndings = ["isn't it", "aren't you", "don't you", "won't you", "can't you", "right?", "correct?"];
  
  // Determine category
  let category: Question['category'] = 'STATEMENT_QUESTION';
  
  if (whWords.some(word => lowerText.startsWith(word))) {
    category = 'WH_QUESTION';
  } else if (yesNoStarters.some(word => lowerText.startsWith(word))) {
    category = 'YES_NO';
  } else if (lowerText.includes(' or ') && text.includes('?')) {
    category = 'CHOICE';
  } else if (tagEndings.some(tag => lowerText.includes(tag))) {
    category = 'TAG';
  } else if (!text.includes('?') && (lowerText.includes('tell me') || lowerText.includes('explain') || lowerText.includes('describe'))) {
    category = 'INDIRECT';
  }
  
  // Determine type based on content and structure
  let type: Question['type'] = 'OPEN_ENDED';
  
  if (category === 'YES_NO' || category === 'TAG') {
    type = 'CLOSED_ENDED';
  } else if (lowerText.includes('would you say') || lowerText.includes('don\'t you think') || lowerText.includes('wouldn\'t you agree')) {
    type = 'LEADING';
  } else if (lowerText.includes('you mean') || lowerText.includes('clarify') || lowerText.includes('understand correctly')) {
    type = 'CLARIFYING';
  } else if (lowerText.includes('and then') || lowerText.includes('what about') || lowerText.includes('also')) {
    type = 'FOLLOW_UP';
  } else if (!text.includes('?') && (lowerText.includes('i wonder') || lowerText.includes('i suppose'))) {
    type = 'RHETORICAL';
  }
  
  // Determine complexity
  let complexity: Question['complexity'] = 'SIMPLE';
  const words = text.split(' ').length;
  const hasSubclauses = text.includes(',') || text.includes(';') || text.includes(' and ') || text.includes(' but ');
  const hasMultipleParts = (text.match(/\?/g) || []).length > 1 || text.includes(' also ') || text.includes(' additionally ');
  
  if (words > 15 || hasSubclauses || hasMultipleParts) {
    complexity = 'COMPLEX';
  } else if (words > 8 || category === 'WH_QUESTION') {
    complexity = 'MODERATE';
  }
  
  return { type, category, complexity };
}

function isQuestion(text: string): boolean {
  const lowerText = text.toLowerCase().trim();
  
  // Direct question indicators
  if (text.includes('?')) return true;
  
  // Indirect question patterns
  const questionPatterns = [
    /^(what|where|when|who|whom|whose|why|which|how)\b/i,
    /^(do|does|did|will|would|can|could|should|shall|may|might|is|are|was|were|have|has|had)\b/i,
    /\b(tell me|explain|describe)\b/i,
    /\b(would you|could you|can you)\b/i,
    /\b(any questions|questions for)\b/i
  ];
  
  return questionPatterns.some(pattern => pattern.test(text));
}

function analyzeQuestionRatio(transcriptFile: string): QuestionRatioAnalysis {
  console.log(`❓ Analyzing question ratio in: ${transcriptFile}`);
  
  if (!fs.existsSync(transcriptFile)) {
    throw new Error(`Transcript file not found: ${transcriptFile}`);
  }

  const transcript = JSON.parse(fs.readFileSync(transcriptFile, "utf-8"));
  const utterances: Utterance[] = transcript.utterances || [];
  
  if (utterances.length === 0) {
    throw new Error("No utterances found in transcript");
  }

  console.log(`📊 Processing ${utterances.length} utterances for question analysis`);

  const questions: Question[] = [];
  const statements: Statement[] = [];
  const speakers = [...new Set(utterances.map(u => u.speaker))];
  const totalDuration = Math.max(...utterances.map(u => u.end));

  console.log(`🎤 Analyzing questions for speakers: ${speakers.join(', ')}`);
  console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(1)}s`);

  // Analyze each utterance
  for (const utterance of utterances) {
    if (isQuestion(utterance.text)) {
      const { type, category, complexity } = identifyQuestionType(utterance.text);
      
      // Calculate confidence based on question indicators
      let confidence = 0.5;
      if (utterance.text.includes('?')) confidence += 0.3;
      if (category === 'WH_QUESTION' || category === 'YES_NO') confidence += 0.2;
      confidence = Math.min(0.95, confidence);
      
      const question: Question = {
        text: utterance.text,
        speaker: utterance.speaker,
        startTime: utterance.start,
        endTime: utterance.end,
        duration: utterance.end - utterance.start,
        type,
        category,
        complexity,
        confidence
      };
      
      questions.push(question);
    } else {
      // Classify statement type
      let statementType: Statement['type'] = 'DECLARATIVE';
      const lowerText = utterance.text.toLowerCase();
      
      if (lowerText.includes('i think') || lowerText.includes('i believe') || lowerText.includes('in my opinion')) {
        statementType = 'OPINION';
      } else if (lowerText.includes('because') || lowerText.includes('the reason') || lowerText.includes('that\'s why')) {
        statementType = 'EXPLANATION';
      } else if (utterance.text.length < 50 && !lowerText.includes('.')) {
        statementType = 'RESPONSE';
      }
      
      const statement: Statement = {
        text: utterance.text,
        speaker: utterance.speaker,
        startTime: utterance.start,
        endTime: utterance.end,
        duration: utterance.end - utterance.start,
        type: statementType
      };
      
      statements.push(statement);
    }
  }

  console.log(`❓ Identified ${questions.length} questions and ${statements.length} statements`);

  // Analyze speaker patterns
  const speakerPatterns: Record<string, SpeakerQuestionPattern> = {};
  
  for (const speaker of speakers) {
    const speakerUtterances = utterances.filter(u => u.speaker === speaker);
    const speakerQuestions = questions.filter(q => q.speaker === speaker);
    const speakerStatements = statements.filter(s => s.speaker === speaker);
    
    const questionCount = speakerQuestions.length;
    const statementCount = speakerStatements.length;
    const totalUtterances = speakerUtterances.length;
    
    const questionRatio = totalUtterances > 0 ? questionCount / totalUtterances : 0;
    const questionToStatementRatio = statementCount > 0 ? questionCount / statementCount : questionCount;
    
    const averageQuestionLength = questionCount > 0 
      ? speakerQuestions.reduce((sum, q) => sum + q.duration, 0) / questionCount 
      : 0;
    
    // Count question types
    const questionTypes: Record<string, number> = {};
    const questionCategories: Record<string, number> = {};
    const questionComplexity: Record<string, number> = {};
    
    speakerQuestions.forEach(q => {
      questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
      questionCategories[q.category] = (questionCategories[q.category] || 0) + 1;
      questionComplexity[q.complexity] = (questionComplexity[q.complexity] || 0) + 1;
    });
    
    // Find notable questions
    const longestQuestion = speakerQuestions.length > 0 
      ? speakerQuestions.reduce((max, current) => current.duration > max.duration ? current : max)
      : undefined;
      
    const shortestQuestion = speakerQuestions.length > 0
      ? speakerQuestions.reduce((min, current) => current.duration < min.duration ? current : min)
      : undefined;
      
    const mostComplexQuestion = speakerQuestions.filter(q => q.complexity === 'COMPLEX')[0] || 
                               speakerQuestions.filter(q => q.complexity === 'MODERATE')[0] ||
                               speakerQuestions[0];

    speakerPatterns[speaker] = {
      speaker,
      totalUtterances,
      questionCount,
      statementCount,
      questionRatio,
      questionToStatementRatio,
      averageQuestionLength,
      questionTypes,
      questionCategories,
      questionComplexity,
      longestQuestion,
      shortestQuestion,
      mostComplexQuestion
    };
  }

  // Analyze conversation dynamics
  const totalQuestions = questions.length;
  const totalStatements = statements.length;
  const overallQuestionRatio = utterances.length > 0 ? totalQuestions / utterances.length : 0;
  
  // Calculate question balance between speakers
  const speakerQuestionCounts = speakers.map(speaker => questions.filter(q => q.speaker === speaker).length);
  const maxQuestions = Math.max(...speakerQuestionCounts);
  const minQuestions = Math.min(...speakerQuestionCounts);
  const questionBalance = maxQuestions > 0 ? (minQuestions / maxQuestions) * 100 : 100;
  
  const questionDensity = (totalQuestions / (totalDuration / 60000)); // questions per minute
  
  const averageQuestionLength = totalQuestions > 0
    ? questions.reduce((sum, q) => sum + q.duration, 0) / totalQuestions
    : 0;
    
  const averageStatementLength = totalStatements > 0
    ? statements.reduce((sum, s) => sum + s.duration, 0) / totalStatements
    : 0;
  
  // Identify question clusters (3+ questions within 30 seconds)
  const questionClusters: ConversationDynamics['questionClusters'] = [];
  const sortedQuestions = [...questions].sort((a, b) => a.startTime - b.startTime);
  
  for (let i = 0; i < sortedQuestions.length - 2; i++) {
    const window = 30000; // 30 seconds
    const startTime = sortedQuestions[i].startTime;
    const questionsInWindow = sortedQuestions.filter(q => 
      q.startTime >= startTime && q.startTime <= startTime + window
    );
    
    if (questionsInWindow.length >= 3) {
      const cluster = {
        startTime,
        endTime: Math.max(...questionsInWindow.map(q => q.endTime)),
        questionCount: questionsInWindow.length,
        speaker: questionsInWindow[0].speaker
      };
      
      // Avoid duplicate clusters
      if (!questionClusters.some(existing => Math.abs(existing.startTime - cluster.startTime) < 10000)) {
        questionClusters.push(cluster);
      }
    }
  }

  const conversationDynamics: ConversationDynamics = {
    totalQuestions,
    totalStatements,
    overallQuestionRatio,
    questionBalance,
    questionDensity,
    averageQuestionLength,
    averageStatementLength,
    questionClusters
  };

  // Generate insights
  const insights: string[] = [];
  
  if (overallQuestionRatio > 0.4) {
    insights.push(`High question density (${(overallQuestionRatio * 100).toFixed(1)}%) - very interactive conversation`);
  } else if (overallQuestionRatio < 0.15) {
    insights.push(`Low question density (${(overallQuestionRatio * 100).toFixed(1)}%) - more statement-based conversation`);
  }
  
  if (questionBalance < 30) {
    insights.push(`Unbalanced questioning - one speaker dominates question asking (${questionBalance.toFixed(1)}% balance)`);
  } else if (questionBalance > 80) {
    insights.push(`Well-balanced questioning between speakers (${questionBalance.toFixed(1)}% balance)`);
  }
  
  if (questionDensity > 3) {
    insights.push(`High question frequency (${questionDensity.toFixed(1)} questions/minute) - intensive inquiry`);
  } else if (questionDensity < 1) {
    insights.push(`Low question frequency (${questionDensity.toFixed(1)} questions/minute) - relaxed pace`);
  }
  
  // Speaker-specific insights
  for (const [speaker, pattern] of Object.entries(speakerPatterns)) {
    if (pattern.questionRatio > 0.6) {
      insights.push(`Speaker ${speaker} asks many questions (${(pattern.questionRatio * 100).toFixed(1)}%) - inquiry-focused role`);
    } else if (pattern.questionRatio < 0.1) {
      insights.push(`Speaker ${speaker} rarely asks questions (${(pattern.questionRatio * 100).toFixed(1)}%) - response-focused role`);
    }
    
    const openEndedCount = pattern.questionTypes['OPEN_ENDED'] || 0;
    const closedEndedCount = pattern.questionTypes['CLOSED_ENDED'] || 0;
    
    if (openEndedCount > closedEndedCount * 2) {
      insights.push(`Speaker ${speaker} prefers open-ended questions - encourages detailed responses`);
    } else if (closedEndedCount > openEndedCount * 2) {
      insights.push(`Speaker ${speaker} prefers closed-ended questions - seeks specific answers`);
    }
  }
  
  if (questionClusters.length > 0) {
    insights.push(`${questionClusters.length} question clusters detected - periods of intensive inquiry`);
  }

  return {
    totalDuration,
    questions,
    statements,
    speakerPatterns,
    conversationDynamics,
    insights
  };
}

function displayQuestionRatioAnalysis(analysis: QuestionRatioAnalysis): void {
  console.log("\n" + "=".repeat(60));
  console.log("❓ QUESTION RATIO ANALYSIS");
  console.log("=".repeat(60));
  
  // Overall metrics
  console.log(`\n📊 CONVERSATION OVERVIEW:`);
  console.log(`   ⏱️  Total Duration: ${(analysis.totalDuration / 1000).toFixed(1)}s`);
  console.log(`   ❓ Total Questions: ${analysis.conversationDynamics.totalQuestions}`);
  console.log(`   💬 Total Statements: ${analysis.conversationDynamics.totalStatements}`);
  console.log(`   📈 Question Ratio: ${(analysis.conversationDynamics.overallQuestionRatio * 100).toFixed(1)}%`);
  console.log(`   ⚖️  Question Balance: ${analysis.conversationDynamics.questionBalance.toFixed(1)}%`);
  console.log(`   🔄 Question Density: ${analysis.conversationDynamics.questionDensity.toFixed(1)} questions/minute`);
  console.log(`   ⏱️  Avg Question Length: ${(analysis.conversationDynamics.averageQuestionLength / 1000).toFixed(1)}s`);
  console.log(`   ⏱️  Avg Statement Length: ${(analysis.conversationDynamics.averageStatementLength / 1000).toFixed(1)}s`);

  // Question clusters
  if (analysis.conversationDynamics.questionClusters.length > 0) {
    console.log(`\n🎯 QUESTION CLUSTERS (${analysis.conversationDynamics.questionClusters.length}):`);
    analysis.conversationDynamics.questionClusters.forEach((cluster, i) => {
      const startTime = (cluster.startTime / 1000).toFixed(1);
      const endTime = (cluster.endTime / 1000).toFixed(1);
      console.log(`   ${i + 1}. ${startTime}s-${endTime}s: ${cluster.questionCount} questions by Speaker ${cluster.speaker}`);
    });
  }

  // Speaker analysis
  console.log(`\n👥 SPEAKER QUESTION PATTERNS:`);
  Object.values(analysis.speakerPatterns).forEach(speaker => {
    console.log(`\n   🎤 Speaker ${speaker.speaker}:`);
    console.log(`      📊 Total Utterances: ${speaker.totalUtterances}`);
    console.log(`      ❓ Questions: ${speaker.questionCount} (${(speaker.questionRatio * 100).toFixed(1)}%)`);
    console.log(`      💬 Statements: ${speaker.statementCount} (${((speaker.statementCount / speaker.totalUtterances) * 100).toFixed(1)}%)`);
    console.log(`      📈 Question:Statement Ratio: ${speaker.questionToStatementRatio.toFixed(2)}:1`);
    console.log(`      ⏱️  Avg Question Length: ${(speaker.averageQuestionLength / 1000).toFixed(1)}s`);
    
    // Question types
    if (speaker.questionCount > 0) {
      console.log(`      🎯 Question Types:`);
      Object.entries(speaker.questionTypes).forEach(([type, count]) => {
        const percentage = ((count as number) / speaker.questionCount * 100).toFixed(1);
        console.log(`         ${type}: ${count} (${percentage}%)`);
      });
      
      console.log(`      📝 Question Categories:`);
      Object.entries(speaker.questionCategories).forEach(([category, count]) => {
        const percentage = ((count as number) / speaker.questionCount * 100).toFixed(1);
        console.log(`         ${category}: ${count} (${percentage}%)`);
      });
      
      console.log(`      🧠 Question Complexity:`);
      Object.entries(speaker.questionComplexity).forEach(([complexity, count]) => {
        const percentage = ((count as number) / speaker.questionCount * 100).toFixed(1);
        console.log(`         ${complexity}: ${count} (${percentage}%)`);
      });
    }
    
    if (speaker.longestQuestion) {
      const q = speaker.longestQuestion;
      console.log(`      📏 Longest Question: "${q.text.slice(0, 60)}..." (${(q.startTime / 1000).toFixed(1)}s)`);
    }
    
    if (speaker.mostComplexQuestion) {
      const q = speaker.mostComplexQuestion;
      console.log(`      🧠 Most Complex: "${q.text.slice(0, 60)}..." (${q.complexity})`);
    }
  });

  // Sample questions by type
  console.log(`\n❓ SAMPLE QUESTIONS BY TYPE:`);
  const questionsByType: Record<string, Question[]> = {};
  analysis.questions.forEach(q => {
    if (!questionsByType[q.type]) questionsByType[q.type] = [];
    questionsByType[q.type].push(q);
  });
  
  Object.entries(questionsByType).forEach(([type, questions]) => {
    if (questions.length > 0) {
      const sample = questions[0];
      console.log(`   ${type}: "${sample.text}" (${(sample.startTime / 1000).toFixed(1)}s)`);
    }
  });

  // Insights
  if (analysis.insights.length > 0) {
    console.log(`\n💡 KEY INSIGHTS:`);
    analysis.insights.forEach((insight, i) => {
      console.log(`   ${i + 1}. ${insight}`);
    });
  }
}

function saveQuestionRatioAnalysis(analysis: QuestionRatioAnalysis, outputFile: string): void {
  const analysisData = {
    timestamp: new Date().toISOString(),
    analysis,
    summary: {
      totalQuestions: analysis.conversationDynamics.totalQuestions,
      totalStatements: analysis.conversationDynamics.totalStatements,
      questionRatio: analysis.conversationDynamics.overallQuestionRatio,
      questionBalance: analysis.conversationDynamics.questionBalance,
      questionDensity: analysis.conversationDynamics.questionDensity,
      speakerCount: Object.keys(analysis.speakerPatterns).length,
      keyInsights: analysis.insights
    }
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(analysisData, null, 2));
  console.log(`\n💾 Question ratio analysis saved to: ${outputFile}`);
}

async function runQuestionRatioAnalysis(inputFile?: string) {
  try {
    // Find transcript file
    let transcriptFile: string;
    
    if (inputFile) {
      transcriptFile = inputFile;
    } else {
      const files = fs.readdirSync('.').filter(file => 
        file.endsWith('_transcript.json') || 
        file.includes('transcript') && file.endsWith('.json')
      );
      
      if (files.length === 0) {
        console.error("❌ No transcript files found");
        console.log("💡 Usage: npx ts-node questionRatioAnalysis.ts [transcript.json]");
        return;
      } else if (files.length === 1) {
        transcriptFile = files[0];
        console.log(`🎯 Auto-detected transcript: ${transcriptFile}`);
      } else {
        console.log("📄 Multiple transcript files found:");
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file}`);
        });
        console.log("💡 Please specify which file to analyze:");
        console.log("   npx ts-node questionRatioAnalysis.ts \"filename.json\"");
        return;
      }
    }
    
    if (!fs.existsSync(transcriptFile)) {
      console.error(`❌ File not found: ${transcriptFile}`);
      return;
    }

    // Run analysis
    const analysis = analyzeQuestionRatio(transcriptFile);
    
    // Display results
    displayQuestionRatioAnalysis(analysis);
    
    // Save results
    const baseName = path.basename(transcriptFile, '.json');
    const outputFile = `${baseName}_question_ratio_analysis.json`;
    saveQuestionRatioAnalysis(analysis, outputFile);
    
    console.log("\n✅ Question ratio analysis complete!");
    
  } catch (error: any) {
    console.error("❌ Error during question ratio analysis:", error.message);
  }
}

// Run if called directly
if (require.main === module) {
  const inputFile = process.argv[2];
  runQuestionRatioAnalysis(inputFile);
}

export { 
  analyzeQuestionRatio, 
  displayQuestionRatioAnalysis, 
  saveQuestionRatioAnalysis,
  runQuestionRatioAnalysis 
}; 