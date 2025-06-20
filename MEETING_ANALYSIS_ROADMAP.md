# 🎯 Meeting Analysis Platform Development Roadmap

## Overview
Build a sophisticated meeting analysis platform that matches the advanced interface shown in the screenshots, featuring real-time sentiment analysis, coaching metrics, and interactive timelines.

## 📋 Phase 1: Project Foundation & Setup
### ✅ Checklist:
- [ ] Initialize Next.js project with TypeScript, Tailwind, and Shadcn UI
- [ ] Set up ACI-VibeOps infrastructure integration
- [ ] Configure Supabase database with meeting analysis schema
- [ ] Migrate existing transcription logic to web API routes
- [ ] Create base layout with navigation and tabs (Overview, Transcript, Moments)
- [ ] Set up environment variables and deployment pipeline

### 🛠️ Technical Tasks:
1. **Project Initialization**
   ```bash
   npx create-next-app@latest ./web-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
   ```

2. **Database Schema (Supabase)**
   ```sql
   -- Core tables for meeting analysis
   CREATE TABLE meetings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     participants JSONB NOT NULL,
     date TIMESTAMP WITH TIME ZONE NOT NULL,
     duration_seconds INTEGER,
     status TEXT DEFAULT 'processing',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE transcripts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     meeting_id UUID REFERENCES meetings(id),
     raw_transcript JSONB,
     speaker_segments JSONB,
     confidence_score DECIMAL(4,4),
     processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE sentiment_moments (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     transcript_id UUID REFERENCES transcripts(id),
     speaker_id TEXT,
     topic TEXT,
     snippet TEXT,
     moment_type TEXT, -- 'positive', 'negative'
     start_time INTEGER,
     end_time INTEGER,
     confidence_percentage INTEGER,
     sentiment_change_percentage INTEGER
   );

   CREATE TABLE coaching_metrics (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     transcript_id UUID REFERENCES transcripts(id),
     speaker_id TEXT,
     question_ratio DECIMAL(4,4),
     talking_speed INTEGER, -- words per minute
     average_patience DECIMAL(4,4), -- seconds
     talk_ratio DECIMAL(4,4),
     language_positivity DECIMAL(4,4),
     voice_emotion TEXT,
     calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **API Route Structure**
   ```
   src/app/api/
   ├── upload/route.ts          # Audio file upload
   ├── transcribe/route.ts      # Transcription processing
   ├── analyze/route.ts         # Generate analysis & coaching metrics
   ├── moments/route.ts         # Sentiment moments detection
   └── meetings/[id]/route.ts   # Get meeting details
   ```

## 📋 Phase 2: Core Meeting Interface
### ✅ Checklist:
- [ ] Create meeting header with participant info and timing
- [ ] Build tabbed navigation (Overview, Transcript, Moments)
- [ ] Implement Overview tab with key segments and detailed view toggle
- [ ] Create speaker identification badges with role labels
- [ ] Add timestamp navigation and segment jumping
- [ ] Build responsive layout for desktop and mobile

### 🎨 UI Components to Build:
1. **MeetingHeader Component**
   - Meeting title and date
   - Participant avatars and names
   - Duration and status indicator
   - Navigation tabs

2. **OverviewTab Component**
   - Brief/Detailed toggle buttons
   - Time-segmented conversation blocks
   - Speaker identification (DM, BA badges)
   - Clickable timestamps for navigation

3. **ParticipantCard Component**
   - Speaker avatar and role
   - Real-time speaking indicators
   - Quick stats preview

## 📋 Phase 3: Advanced Sentiment Analysis & Moments
### ✅ Checklist:
- [ ] Implement real-time sentiment tracking during conversation
- [ ] Create sentiment change detection algorithm
- [ ] Build moments table with expandable details
- [ ] Add sentiment timeline visualization
- [ ] Implement topic extraction and categorization
- [ ] Create color-coded sentiment indicators (red/green)
- [ ] Add filtering and sorting for moments

### 🧠 AI Analysis Features:
1. **Sentiment Moment Detection**
   ```typescript
   interface SentimentMoment {
     topic: string;
     snippet: string;
     momentType: 'positive' | 'negative';
     timeRange: { start: string; end: string };
     sentimentChange: number; // percentage increase/decrease
     speaker: 'DM' | 'BA';
   }
   ```

2. **Topic Classification**
   - "Konaklama Durumu ve Startup Fikri" (Accommodation Status & Startup Ideas)
   - "Startup'ın Gelişim Süreci" (Startup Development Process)
   - "Müşteri Profili ve Satış Süreci" (Customer Profile & Sales Process)

3. **Sentiment Timeline Visualization**
   - Color-coded bars (red for negative, green for positive)
   - Hoverable moments with details
   - Speaker-specific sentiment tracks

## 📋 Phase 4: Key Moments & Timeline Visualization
### ✅ Checklist:
- [ ] Build interactive timeline with color-coded sentiment bars
- [ ] Implement moment type categorization (Language Positivity, Vocal Energy, Language Emotion)
- [ ] Create expandable moment details with full context
- [ ] Add timeline scrubbing and playback control
- [ ] Implement real-time moment highlighting during playback
- [ ] Create moment bookmarking and notes system

### 📊 Timeline Features:
1. **Interactive Timeline Component**
   - Two-track design (one per speaker)
   - Color-coded sentiment blocks
   - Clickable moments for detailed view
   - Zoom and pan functionality

2. **Moment Categories**
   - 🔷 Language Positivity (blue circles)
   - 🟠 Vocal Energy (orange circles) 
   - 🟣 Language Emotion (purple circles)
   - ⚡ Positive moments (green lightning)
   - ⚡ Negative moments (red lightning)

## 📋 Phase 5: Coaching Dashboard & Metrics
### ✅ Checklist:
- [ ] Build comprehensive coaching metrics for each participant
- [ ] Implement Question Ratio calculation and visualization
- [ ] Create Talking Speed analysis (words per minute)
- [ ] Build Average Patience measurement (pause analysis)
- [ ] Calculate Talk Ratio between participants
- [ ] Implement Language Positivity scoring
- [ ] Add Voice Emotion detection and classification
- [ ] Create suggestions and recommendations engine

### 📈 Coaching Metrics Implementation:
1. **Question Ratio Analysis**
   ```typescript
   function calculateQuestionRatio(transcript: Word[]): number {
     const questions = transcript.filter(word => 
       word.text.includes('?') || isQuestionWord(word.text)
     );
     return (questions.length / transcript.length) * 100;
   }
   ```

2. **Talking Speed Calculation**
   ```typescript
   function calculateTalkingSpeed(speaker: SpeakerData): number {
     const durationMinutes = speaker.totalDuration / 60000;
     return Math.round(speaker.wordCount / durationMinutes);
   }
   ```

3. **Average Patience (Pause Analysis)**
   ```typescript
   function calculateAveragePause(segments: SpeakerSegment[]): number {
     const pauses = segments.map(segment => segment.pauseBefore || 0);
     return pauses.reduce((sum, pause) => sum + pause, 0) / pauses.length;
   }
   ```

4. **Coaching Metrics Card Design**
   - Question Ratio: 3% ▲ (Suggested: 10% - 30%)
   - Talking Speed: 212 words/min ▼ (Suggested: 150 - 170)
   - Average Patience: 0.62 Seconds ▲ (Suggested: 1 - 1.8)
   - Talk Ratio: 40% ▲ (Suggested: 50% - 70%)
   - Language Positivity: 25% Positive ▲ (Suggested: 50% - 100%)
   - Voice Emotion: 84% Happy (Suggested: 15% - 100%)

## 📋 Phase 6: Real-time Audio Processing & AI Integration
### ✅ Checklist:
- [ ] Integrate AssemblyAI real-time transcription
- [ ] Implement speaker diarization with role assignment
- [ ] Add live sentiment analysis during recording
- [ ] Create real-time coaching feedback system
- [ ] Build live moment detection and alerting
- [ ] Implement ACI MCP integration for AI visuals
- [ ] Add voice emotion recognition

### 🤖 AI Integration with ACI MCP:
1. **Real-time Sentiment Analysis**
   ```typescript
   async function analyzeRealtimeSentiment(audioChunk: ArrayBuffer) {
     return await mcp_aci_vibeops_server_ACI_EXECUTE_FUNCTION({
       function_name: "OPENAI__CHAT_COMPLETION",
       function_arguments: {
         model: "gpt-4o-mini",
         messages: [{
           role: "system",
           content: "Analyze sentiment and coaching metrics from this transcript segment..."
         }]
       }
     });
   }
   ```

2. **AI-Generated Meeting Insights**
   ```typescript
   async function generateMeetingInsights(analysisData: any) {
     return await mcp_aci_vibeops_server_ACI_EXECUTE_FUNCTION({
       function_name: "REPLICATE__MODEL_FLUX_1_1_PRO",
       function_arguments: {
         body: {
           input: {
             prompt: `Create a professional meeting analysis infographic showing sentiment timeline, key moments, and coaching insights`,
             aspect_ratio: "16:9"
           }
         }
       }
     });
   }
   ```

## 📋 Phase 7: Advanced Features & Polish
### ✅ Checklist:
- [ ] Add meeting recording and playback functionality
- [ ] Implement transcript search and keyword highlighting
- [ ] Create exportable reports (PDF, CSV)
- [ ] Add team collaboration features
- [ ] Implement meeting templates and goal setting
- [ ] Create performance tracking over time
- [ ] Add integration with calendar systems
- [ ] Build mobile-responsive design

## 🎯 Key Technical Architecture

### Frontend Stack:
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** for components
- **React Query** for data fetching
- **Zustand** for state management
- **Recharts** for timeline visualizations

### Backend Integration:
- **Supabase** for database and real-time features
- **AssemblyAI** for transcription and sentiment analysis
- **ACI MCP** for AI model integrations
- **WebSocket** for real-time updates
- **File upload** with progress tracking

### Data Flow:
1. Audio Upload → AssemblyAI Processing
2. Real-time transcription → Sentiment analysis
3. Speaker diarization → Coaching metrics calculation
4. Moment detection → Timeline visualization
5. AI insights generation → Report compilation

## 🚀 Development Timeline

- **Week 1-2**: Phase 1 & 2 (Foundation + Core Interface)
- **Week 3**: Phase 3 (Sentiment Analysis & Moments)
- **Week 4**: Phase 4 (Timeline Visualization)
- **Week 5**: Phase 5 (Coaching Dashboard)
- **Week 6**: Phase 6 (Real-time AI Integration)
- **Week 7**: Phase 7 (Polish & Advanced Features)

## 📱 Mobile Considerations
- Responsive timeline with touch interactions
- Collapsible coaching metrics cards
- Swipeable tabs for navigation
- Voice recording with live feedback
- Offline mode for reviewing past meetings

This roadmap will create a comprehensive meeting analysis platform that matches and potentially exceeds the functionality shown in your screenshots! 