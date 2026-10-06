let audioCtx: AudioContext | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let isMuted = false;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const setMuted = (muted: boolean) => {
  isMuted = muted;
  if (muted) {
    stopHeartbeatLoop();
    if (padGain && audioCtx) {
      padGain.gain.cancelScheduledValues(audioCtx.currentTime);
      padGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
    }
  } else {
    // Restore volume
    if (padGain && audioCtx) {
      padGain.gain.cancelScheduledValues(audioCtx.currentTime);
      padGain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.5);
    }
  }
};

export const getMuted = () => isMuted;

const playThump = (freq: number, dropFreq: number, dur: number) => {
  if (isMuted || !audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  
  filter.type = 'lowpass';
  filter.frequency.value = 150;
  
  osc.connect(gain);
  gain.connect(filter);
  filter.connect(audioCtx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(dropFreq, audioCtx.currentTime + dur);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.8, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
  
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + dur);
};

export const playHeartbeat = (accelerated: boolean) => {
  if (isMuted) return;
  initAudio();
  
  if (accelerated) {
    // ~100 BPM
    playThump(80, 40, 0.2);
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => {
      playThump(70, 30, 0.25);
      if (navigator.vibrate) navigator.vibrate(60);
    }, 200);
  } else {
    // ~55 BPM
    playThump(65, 45, 0.3);
    if (navigator.vibrate) navigator.vibrate(60);
    setTimeout(() => {
      playThump(55, 35, 0.4);
      if (navigator.vibrate) navigator.vibrate(100);
    }, 300);
  }
};

export const startHeartbeatLoop = (accelerated: boolean) => {
  stopHeartbeatLoop();
  if (isMuted) return;
  
  // Syncs perfectly with ~72 BPM (Wet the Bed)
  // 60 / 72 = 0.833s (833ms) or 1200ms for slow groove
  const interval = accelerated ? 600 : 1200; 
  playHeartbeat(accelerated);
  heartbeatInterval = setInterval(() => playHeartbeat(accelerated), interval);
};

export const stopHeartbeatLoop = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

const playlist = [
  '/audio/wet-the-bed.mp3'
];

let currentSongIndex = 0;
let audioElement: HTMLAudioElement | null = null;
let mediaSource: MediaElementAudioSourceNode | null = null;
let padGain: GainNode | null = null;

export const startAmbientMusic = () => {
  if (isMuted || !audioCtx) return;
  if (audioElement && !audioElement.paused) return; // already playing

  if (!audioElement) {
    audioElement = new Audio(playlist[currentSongIndex]);
    
    // Auto-advance mini-queue
    audioElement.addEventListener('ended', () => {
      currentSongIndex = (currentSongIndex + 1) % playlist.length;
      audioElement!.src = playlist[currentSongIndex];
      audioElement!.play().catch(e => console.warn("Audio play blocked", e));
    });

    padGain = audioCtx.createGain();
    padGain.gain.value = 0.4; // 40% volume as requested

    // Pipe through Web Audio API for smooth volume ducking
    mediaSource = audioCtx.createMediaElementSource(audioElement);
    mediaSource.connect(padGain);
    padGain.connect(audioCtx.destination);
  }

  if (audioElement && audioElement.paused) {
    audioElement.play().catch(e => console.warn("Audio play blocked", e));
  }
};

export const setAmbientDucked = (ducked: boolean) => {
  if (padGain && audioCtx && !isMuted) {
    padGain.gain.cancelScheduledValues(audioCtx.currentTime);
    padGain.gain.setValueAtTime(padGain.gain.value, audioCtx.currentTime);
    // Duck to 15% so music is still clear, return to 40%
    padGain.gain.linearRampToValueAtTime(ducked ? 0.15 : 0.4, audioCtx.currentTime + 1.0);
  }
};

export const stopAmbientMusic = () => {
  if (padGain && audioCtx) {
    padGain.gain.cancelScheduledValues(audioCtx.currentTime);
    padGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
  }
};
