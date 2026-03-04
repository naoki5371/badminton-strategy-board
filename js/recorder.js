// recorder.js - 操作記録・アニメーション再生モジュール
const Recorder = (() => {
  let frames = [];       // { time, players, drawings }
  let isRecording = false;
  let isPlaying = false;
  let isPaused = false;
  let recordStartTime = 0;
  let playStartTime = 0;
  let pauseTime = 0;
  let totalDuration = 0;
  let animFrameId = null;
  let captureInterval = null;

  const CAPTURE_INTERVAL_MS = 100; // 100msごとにキャプチャ

  // UI要素
  const recBtn = document.getElementById('rec-btn');
  const stopBtn = document.getElementById('stop-btn');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const rewindBtn = document.getElementById('rewind-btn');
  const seekBar = document.getElementById('seek-bar');
  const timeDisplay = document.getElementById('playback-time');

  function init() {
    recBtn.addEventListener('click', toggleRecord);
    stopBtn.addEventListener('click', stopRecording);
    playBtn.addEventListener('click', play);
    pauseBtn.addEventListener('click', pause);
    rewindBtn.addEventListener('click', rewind);
    seekBar.addEventListener('input', onSeek);

    Players.onMove(() => {
      if (isRecording) captureFrame();
    });
  }

  function toggleRecord() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function startRecording() {
    frames = [];
    isRecording = true;
    recordStartTime = Date.now();

    recBtn.classList.add('recording');
    recBtn.querySelector('.rec-dot').style.display = '';
    stopBtn.disabled = false;
    playBtn.disabled = true;
    pauseBtn.disabled = true;
    rewindBtn.disabled = true;
    seekBar.disabled = true;

    // 初期フレームをキャプチャ
    captureFrame();

    // 定期的にキャプチャ（選手の移動だけでなく描画の変化も記録）
    captureInterval = setInterval(() => {
      if (isRecording) captureFrame();
    }, CAPTURE_INTERVAL_MS);
  }

  function stopRecording() {
    if (!isRecording) return;
    isRecording = false;

    if (captureInterval) {
      clearInterval(captureInterval);
      captureInterval = null;
    }

    // 最終フレームをキャプチャ
    captureFrame();

    // 重複フレームを除去（変化がないフレームを間引く）
    frames = deduplicateFrames(frames);

    totalDuration = frames.length > 0
      ? frames[frames.length - 1].time
      : 0;

    recBtn.classList.remove('recording');
    stopBtn.disabled = true;

    if (frames.length > 1) {
      playBtn.disabled = false;
      rewindBtn.disabled = false;
      seekBar.disabled = false;
      seekBar.max = totalDuration;
    }

    updateTimeDisplay(0);
  }

  function captureFrame() {
    const time = Date.now() - recordStartTime;
    frames.push({
      time,
      players: Players.getState(),
      drawings: Drawing.getState(),
    });
  }

  function deduplicateFrames(frames) {
    if (frames.length <= 1) return frames;
    const result = [frames[0]];
    let lastJson = JSON.stringify({ p: frames[0].players, d: frames[0].drawings });

    for (let i = 1; i < frames.length; i++) {
      const json = JSON.stringify({ p: frames[i].players, d: frames[i].drawings });
      if (json !== lastJson) {
        result.push(frames[i]);
        lastJson = json;
      }
    }

    // 最後のフレームは必ず含める
    const lastFrame = frames[frames.length - 1];
    if (result[result.length - 1] !== lastFrame) {
      result.push(lastFrame);
    }

    return result;
  }

  function play() {
    if (frames.length < 2) return;

    if (isPaused) {
      // 一時停止からの再開
      const elapsed = pauseTime;
      playStartTime = Date.now() - elapsed;
      isPaused = false;
    } else {
      playStartTime = Date.now();
    }

    isPlaying = true;
    playBtn.disabled = true;
    pauseBtn.disabled = false;
    rewindBtn.disabled = false;
    recBtn.disabled = true;

    playLoop();
  }

  function playLoop() {
    if (!isPlaying || isPaused) return;

    const elapsed = Date.now() - playStartTime;
    const frame = getFrameAt(elapsed);

    if (frame) {
      Players.setState(frame.players);
      Drawing.setState(frame.drawings);
      seekBar.value = elapsed;
      updateTimeDisplay(elapsed);
    }

    if (elapsed >= totalDuration) {
      stopPlayback();
      return;
    }

    animFrameId = requestAnimationFrame(playLoop);
  }

  function pause() {
    if (!isPlaying) return;
    isPaused = true;
    pauseTime = Date.now() - playStartTime;
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
  }

  function rewind() {
    stopPlayback();
    if (frames.length > 0) {
      Players.setState(frames[0].players);
      Drawing.setState(frames[0].drawings);
      seekBar.value = 0;
      updateTimeDisplay(0);
    }
    playBtn.disabled = false;
  }

  function stopPlayback() {
    isPlaying = false;
    isPaused = false;
    pauseTime = 0;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
    }
    playBtn.disabled = false;
    pauseBtn.disabled = true;
    recBtn.disabled = false;
  }

  function onSeek() {
    const time = parseInt(seekBar.value);

    // 再生中に操作した場合は一時停止
    if (isPlaying && !isPaused) {
      pause();
    }

    const frame = getFrameAt(time);
    if (frame) {
      Players.setState(frame.players);
      Drawing.setState(frame.drawings);
      pauseTime = time;
      updateTimeDisplay(time);
    }
  }

  function getFrameAt(time) {
    if (frames.length === 0) return null;
    if (time <= 0) return frames[0];
    if (time >= totalDuration) return frames[frames.length - 1];

    // 指定時間以前の最新フレームを探す
    let result = frames[0];
    for (let i = 0; i < frames.length; i++) {
      if (frames[i].time <= time) {
        result = frames[i];
      } else {
        break;
      }
    }
    return result;
  }

  function updateTimeDisplay(currentMs) {
    const current = formatTime(currentMs);
    const total = formatTime(totalDuration);
    timeDisplay.textContent = `${current} / ${total}`;
  }

  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function getState() {
    return {
      frames: JSON.parse(JSON.stringify(frames)),
      totalDuration,
    };
  }

  function setState(state) {
    frames = state.frames || [];
    totalDuration = state.totalDuration || 0;

    if (frames.length > 1) {
      playBtn.disabled = false;
      rewindBtn.disabled = false;
      seekBar.disabled = false;
      seekBar.max = totalDuration;
    }
    updateTimeDisplay(0);
  }

  function reset() {
    stopPlayback();
    frames = [];
    totalDuration = 0;
    playBtn.disabled = true;
    pauseBtn.disabled = true;
    rewindBtn.disabled = true;
    seekBar.disabled = true;
    seekBar.value = 0;
    updateTimeDisplay(0);
  }

  return {
    init,
    reset,
    getState,
    setState,
    isRecording: () => isRecording,
  };
})();
