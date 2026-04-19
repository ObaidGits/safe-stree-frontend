import React, { useRef, useEffect, useState } from 'react';
import alertSound from '../../../assets/Audio/alert.mp3';

const AlertAudio = ({ play }) => {
  const audioRef = useRef(new Audio(alertSound));
  const [audioEnabled, setAudioEnabled] = useState(
    localStorage.getItem('audioEnabled') === 'true'
  );
  const [showPrompt, setShowPrompt] = useState(
    localStorage.getItem('audioEnabled') !== 'true'
  );
  const stopTimer = useRef(null);

  const enableAudioPlayback = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Save permanently in localStorage
      setAudioEnabled(true);
      setShowPrompt(false);
      localStorage.setItem('audioEnabled', 'true');

      document.removeEventListener('click', enableAudioPlayback);
      document.removeEventListener('touchstart', enableAudioPlayback);
    } catch (error) {
      console.error('Audio unlock failed:', error);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'auto';
    audio.volume = 1.0;

    if (!audioEnabled) {
      document.addEventListener('click', enableAudioPlayback);
      document.addEventListener('touchstart', enableAudioPlayback);
    }

    return () => {
      document.removeEventListener('click', enableAudioPlayback);
      document.removeEventListener('touchstart', enableAudioPlayback);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, [audioEnabled]);

  useEffect(() => {
    if (!play || !audioEnabled) return;

    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          stopTimer.current = setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 5000);
        })
        .catch(err => console.error('Audio playback failed:', err));
    }
  }, [play, audioEnabled]);

  return (
    <>
      {showPrompt && (
        <div className="audio-permission-banner" style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff5722',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000,
          animation: 'pulse 2s infinite'
        }}>
          ⚠️ Click anywhere to enable alert sounds ⚠️
        </div>
      )}
    </>
  );
};

export default AlertAudio;
