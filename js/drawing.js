// drawing.js - フリーハンド描画モジュール
const Drawing = (() => {
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');

  let drawings = []; // 描画履歴
  let isDrawing = false;
  let currentPath = [];

  const STROKE_COLOR = '#111111';
  const STROKE_WIDTH = 3;

  function init() {
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
  }

  function getCanvasPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  // タッチイベント
  function onTouchStart(e) {
    e.preventDefault();
    const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    handleStart(pos);
  }

  function onTouchMove(e) {
    e.preventDefault();
    const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    handleMove(pos);
  }

  function onTouchEnd() {
    handleEnd();
  }

  // マウスイベント
  function onMouseDown(e) {
    const pos = getCanvasPos(e.clientX, e.clientY);
    handleStart(pos);
  }

  function onMouseMove(e) {
    if (!isDrawing) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    handleMove(pos);
  }

  function onMouseUp() {
    handleEnd();
  }

  function handleStart(pos) {
    isDrawing = true;
    currentPath = [{ ...pos }];
  }

  function handleMove(pos) {
    if (!isDrawing) return;
    currentPath.push({ ...pos });
    redraw();
    drawPath(currentPath, STROKE_COLOR, STROKE_WIDTH);
  }

  function handleEnd() {
    if (!isDrawing) return;
    isDrawing = false;

    if (currentPath.length > 1) {
      drawings.push({
        type: 'freehand',
        points: [...currentPath],
        color: STROKE_COLOR,
        width: STROKE_WIDTH,
      });
    }

    currentPath = [];
    redraw();
  }

  function drawPath(points, color, width) {
    if (points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawings.forEach(d => {
      drawPath(d.points, d.color, d.width);
    });
  }

  function undo() {
    if (drawings.length > 0) {
      drawings.pop();
      redraw();
    }
  }

  function clear() {
    drawings = [];
    redraw();
  }

  function getState() {
    return JSON.parse(JSON.stringify(drawings));
  }

  function setState(state) {
    drawings = JSON.parse(JSON.stringify(state));
    redraw();
  }

  return {
    init,
    redraw,
    undo,
    clear,
    getState,
    setState,
  };
})();
