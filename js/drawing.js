// drawing.js - 描画ツールモジュール
const Drawing = (() => {
  const canvas = document.getElementById('drawing-canvas');
  const ctx = canvas.getContext('2d');

  let drawings = []; // 描画履歴
  let isDrawing = false;
  let currentPath = [];
  let startPoint = null;

  const STROKE_COLOR = '#111111';
  const STROKE_WIDTH = 3;
  const SHUTTLE_COLOR = '#ffdd00';
  const SHUTTLE_WIDTH = 2.5;

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
    const tool = App.getCurrentTool();
    if (tool === 'move') return;
    e.preventDefault();
    const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    handleStart(pos, tool);
  }

  function onTouchMove(e) {
    const tool = App.getCurrentTool();
    if (tool === 'move') return;
    e.preventDefault();
    const pos = getCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    handleMove(pos, tool);
  }

  function onTouchEnd(e) {
    const tool = App.getCurrentTool();
    if (tool === 'move') return;
    handleEnd(tool);
  }

  // マウスイベント
  function onMouseDown(e) {
    const tool = App.getCurrentTool();
    if (tool === 'move') return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    handleStart(pos, tool);
  }

  function onMouseMove(e) {
    const tool = App.getCurrentTool();
    if (tool === 'move' || !isDrawing) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    handleMove(pos, tool);
  }

  function onMouseUp(e) {
    const tool = App.getCurrentTool();
    if (tool === 'move') return;
    handleEnd(tool);
  }

  function handleStart(pos, tool) {
    if (tool === 'text') {
      showTextInput(pos);
      return;
    }
    isDrawing = true;
    startPoint = { ...pos };
    currentPath = [{ ...pos }];
  }

  function handleMove(pos, tool) {
    if (!isDrawing) return;

    // 全ツールで最新位置を記録（handleEnd時に終点として使用）
    currentPath.push({ ...pos });

    if (tool === 'freehand') {
      redraw();
      drawPath(currentPath, STROKE_COLOR, STROKE_WIDTH);
    } else if (tool === 'shuttle') {
      redraw();
      drawShuttleLine(startPoint, pos);
    } else if (tool === 'arrow') {
      redraw();
      drawArrow(startPoint, pos, STROKE_COLOR, STROKE_WIDTH);
    }
  }

  function handleEnd(tool) {
    if (!isDrawing) return;
    isDrawing = false;

    if (tool === 'freehand' && currentPath.length > 1) {
      drawings.push({
        type: 'freehand',
        points: [...currentPath],
        color: STROKE_COLOR,
        width: STROKE_WIDTH,
      });
    } else if (tool === 'shuttle' && startPoint) {
      const endPoint = currentPath[currentPath.length - 1] || startPoint;
      drawings.push({
        type: 'shuttle',
        start: { ...startPoint },
        end: { ...endPoint },
      });
    } else if (tool === 'arrow' && startPoint) {
      const endPoint = currentPath[currentPath.length - 1] || startPoint;
      drawings.push({
        type: 'arrow',
        start: { ...startPoint },
        end: { ...endPoint },
        color: STROKE_COLOR,
        width: STROKE_WIDTH,
      });
    }

    currentPath = [];
    startPoint = null;
    redraw();
  }

  function showTextInput(pos) {
    const overlay = document.getElementById('text-input-overlay');
    const field = document.getElementById('text-input-field');
    overlay.classList.remove('hidden');
    overlay.style.left = pos.x + 'px';
    overlay.style.top = pos.y + 'px';
    field.value = '';
    field.focus();

    // 画面外にはみ出す場合は位置を調整
    requestAnimationFrame(() => {
      const rect = overlay.getBoundingClientRect();
      const containerRect = canvas.getBoundingClientRect();
      if (rect.right > containerRect.right) {
        overlay.style.left = (pos.x - rect.width) + 'px';
      }
      if (rect.bottom > containerRect.bottom) {
        overlay.style.top = (pos.y - rect.height) + 'px';
      }
    });

    const confirmBtn = document.getElementById('text-confirm-btn');
    const cancelBtn = document.getElementById('text-cancel-btn');

    const onConfirm = () => {
      const text = field.value.trim();
      if (text) {
        drawings.push({
          type: 'text',
          x: pos.x,
          y: pos.y,
          text: text,
          color: STROKE_COLOR,
        });
        redraw();
      }
      overlay.classList.add('hidden');
      cleanup();
    };

    const onCancel = () => {
      overlay.classList.add('hidden');
      cleanup();
    };

    const cleanup = () => {
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
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

  function drawShuttleLine(from, to) {
    // 点線でシャトル軌道を描画
    ctx.strokeStyle = SHUTTLE_COLOR;
    ctx.lineWidth = SHUTTLE_WIDTH;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // シャトルアイコン（終点に小さい丸）
    ctx.fillStyle = SHUTTLE_COLOR;
    ctx.beginPath();
    ctx.arc(to.x, to.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // 始点にも小さい丸
    ctx.beginPath();
    ctx.arc(from.x, from.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawArrow(from, to, color, width) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headLen = 14;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';

    // 線
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // 矢じり
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(
      to.x - headLen * Math.cos(angle - Math.PI / 6),
      to.y - headLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - headLen * Math.cos(angle + Math.PI / 6),
      to.y - headLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  function drawText(x, y, text, color) {
    ctx.fillStyle = color;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'top';

    const lines = text.split('\n');
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * 18);
    });
  }

  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawings.forEach(d => {
      switch (d.type) {
        case 'freehand':
          drawPath(d.points, d.color, d.width);
          break;
        case 'shuttle':
          drawShuttleLine(d.start, d.end);
          break;
        case 'arrow':
          drawArrow(d.start, d.end, d.color, d.width);
          break;
        case 'text':
          drawText(d.x, d.y, d.text, d.color);
          break;
      }
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
