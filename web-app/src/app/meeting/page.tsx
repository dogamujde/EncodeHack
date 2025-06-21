"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings,
  Volume2,
  VolumeX,
  Check,
  Monitor,
  Camera,
  CameraOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LiveMeetingPage() {
  const router = useRouter()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('computer')
  const [volume, setVolume] = useState(75)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        if (isVideoOn) {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
            audio: false // Don't request audio here to avoid conflicts
          })
          setStream(mediaStream)
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
          }
        } else {
          if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
          }
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isVideoOn])

  const toggleCamera = () => {
    setIsVideoOn(!isVideoOn)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
    }
  }

  const handleJoinNow = () => {
    // Stop current stream before navigating
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    // Navigate to live-meeting page
    router.push('/live-meeting')
  }

  const handleCancel = () => {
    // Stop current stream and go back to home
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#1F1F23] text-white flex flex-col">
      {/* Teams Header */}
      <div className="flex justify-center items-center py-6 mt-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#6264A7] rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <div className="w-2 h-2 bg-[#6264A7] rounded-full"></div>
        </div>
      </div>

      {/* Meeting Title */}
      <div className="text-center mb-6 mt-8">
        <h1 className="text-2xl font-light mb-2">ISG Reading Group June 2025 - Same-sex love and marriage through the years</h1>
        <p className="text-gray-400 text-sm">Thursday 19 Jun • 12:30 - 13:30 BST</p>
      </div>

      {/* Main Content - Positioned more to the right and down */}
      <div className="flex-1 flex justify-center items-center px-4 pt-0">
        <div className="flex gap-8 max-w-6xl w-full justify-center ml-32">
          {/* Camera Section - Made larger and rectangular */}
          <div className="flex flex-col">
            <div className="relative bg-gray-800 rounded-lg overflow-hidden" style={{ width: '480px', height: '360px' }}>
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <CameraOff className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Camera Controls - Positioned at bottom */}
              <div className="absolute bottom-4 left-4 flex gap-3">
                <button
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isVideoOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {isVideoOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={toggleMute}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    !isMuted ? 'bg-[#6264A7] hover:bg-[#5558A0]' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {!isMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                
                <button className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center transition-colors">
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </button>
                
                <span className="text-sm text-gray-300 flex items-center ml-2">Background filters</span>
                
                <button className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center transition-colors ml-auto">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Audio Options - Matching height */}
          <div className="w-80" style={{ height: '360px' }}>
            {/* Computer Audio */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors mb-4 ${
                selectedAudioDevice === 'computer' 
                  ? 'border-[#6264A7] bg-[#6264A7]/10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => setSelectedAudioDevice('computer')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#6264A7] rounded flex items-center justify-center">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium">Computer audio</span>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAudioDevice === 'computer' ? 'border-[#6264A7]' : 'border-gray-400'
                }`}>
                  {selectedAudioDevice === 'computer' && (
                    <div className="w-3 h-3 bg-[#6264A7] rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Customised Setup */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-300">Customised Setup</span>
                <button className="text-gray-400 hover:text-white">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={toggleMute}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    !isMuted ? 'bg-[#6264A7] hover:bg-[#5558A0]' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  {!isMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                
                <Volume2 className="w-4 h-4 text-gray-400" />
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            {/* Other Audio Options */}
            <div className="space-y-3">
              {[
                { id: 'phone', label: 'Phone audio', icon: '📞' },
                { id: 'room', label: 'Room audio', icon: '💻' },
                { id: 'none', label: "Don't use audio", icon: '🚫' }
              ].map((option) => (
                <div
                  key={option.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAudioDevice === option.id 
                      ? 'border-[#6264A7] bg-[#6264A7]/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedAudioDevice(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAudioDevice === option.id ? 'border-[#6264A7]' : 'border-gray-400'
                    }`}>
                      {selectedAudioDevice === option.id && (
                        <div className="w-2.5 h-2.5 bg-[#6264A7] rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-center gap-4 pb-8">
        <button className="px-6 py-2 border border-gray-500 text-gray-300 rounded hover:bg-gray-700 transition-colors" onClick={handleCancel}>
          Cancel
        </button>
        <button className="px-8 py-2 bg-[#6264A7] text-white rounded hover:bg-[#5558A0] transition-colors" onClick={handleJoinNow}>
          Join now
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6264A7;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #6264A7;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
} 