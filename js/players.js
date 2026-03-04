// players.js - 選手アイコン管理モジュール
const Players = (() => {
  const layer = document.getElementById('players-layer');
  let players = [];
  let currentMode = 'singles';
  let dragTarget = null;
  let dragOffset = { x: 0, y: 0 };
  let onMoveCallback = null;

  // モード別の選手配置（コート座標系）
  const INITIAL_POSITIONS = {
    singles: [
      { id: 'p1', courtX: 3.05, courtY: 4.5, type: 'default' },
      { id: 'p2', courtX: 3.05, courtY: 8.9, type: 'default' },
    ],
    doubles: [
      { id: 'p1', courtX: 1.5, courtY: 3.5, type: 'default' },
      { id: 'p2', courtX: 4.6, courtY: 5.5, type: 'default' },
      { id: 'p3', courtX: 1.5, courtY: 7.9, type: 'default' },
      { id: 'p4', courtX: 4.6, courtY: 9.9, type: 'default' },
    ],
    mixed: [
      { id: 'p1', courtX: 1.5, courtY: 3.5, type: 'male' },
      { id: 'p2', courtX: 4.6, courtY: 5.5, type: 'female' },
      { id: 'p3', courtX: 1.5, courtY: 7.9, type: 'male' },
      { id: 'p4', courtX: 4.6, courtY: 9.9, type: 'female' },
    ],
  };

  function init(mode) {
    currentMode = mode;
    layer.innerHTML = '';
    players = [];

    const positions = INITIAL_POSITIONS[mode];
    positions.forEach(pos => {
      createPlayer(pos.id, pos.courtX, pos.courtY, pos.type);
    });
    updatePositions();
  }

  function createPlayer(id, courtX, courtY, type) {
    const el = document.createElement('div');
    el.className = `player-icon ${type}`;
    el.dataset.id = id;
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    layer.appendChild(el);

    players.push({ id, courtX, courtY, type, el });
  }

  function updatePositions() {
    players.forEach(p => {
      const pos = Court.courtToCanvas(p.courtX, p.courtY);
      p.el.style.left = (pos.x - 18) + 'px';
      p.el.style.top = (pos.y - 18) + 'px';
    });
  }

  function onTouchStart(e) {
    if (App.getCurrentTool() !== 'move') return;
    e.preventDefault();
    const touch = e.touches[0];
    const player = findPlayerByElement(e.currentTarget);
    if (!player) return;

    dragTarget = player;
    const pos = Court.courtToCanvas(player.courtX, player.courtY);
    dragOffset.x = touch.clientX - pos.x;
    dragOffset.y = touch.clientY - pos.y;

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function onTouchMove(e) {
    if (!dragTarget) return;
    e.preventDefault();
    const touch = e.touches[0];
    movePlayerTo(touch.clientX - dragOffset.x, touch.clientY - dragOffset.y);
  }

  function onTouchEnd() {
    dragTarget = null;
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  }

  function onMouseDown(e) {
    if (App.getCurrentTool() !== 'move') return;
    e.preventDefault();
    const player = findPlayerByElement(e.currentTarget);
    if (!player) return;

    dragTarget = player;
    const pos = Court.courtToCanvas(player.courtX, player.courtY);
    dragOffset.x = e.clientX - pos.x;
    dragOffset.y = e.clientY - pos.y;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!dragTarget) return;
    movePlayerTo(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
  }

  function onMouseUp() {
    dragTarget = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  function movePlayerTo(canvasX, canvasY) {
    if (!dragTarget) return;
    const court = Court.canvasToCourt(canvasX, canvasY);
    const dims = Court.getCourtDimensions();

    // コート内に制限
    court.x = Math.max(0, Math.min(dims.width, court.x));
    court.y = Math.max(0, Math.min(dims.height, court.y));

    dragTarget.courtX = court.x;
    dragTarget.courtY = court.y;

    const pos = Court.courtToCanvas(court.x, court.y);
    dragTarget.el.style.left = (pos.x - 18) + 'px';
    dragTarget.el.style.top = (pos.y - 18) + 'px';

    if (onMoveCallback) {
      onMoveCallback(dragTarget.id, court.x, court.y);
    }
  }

  function findPlayerByElement(el) {
    return players.find(p => p.el === el);
  }

  function getState() {
    return players.map(p => ({
      id: p.id,
      courtX: p.courtX,
      courtY: p.courtY,
      type: p.type,
    }));
  }

  function setState(state) {
    state.forEach(s => {
      const player = players.find(p => p.id === s.id);
      if (player) {
        player.courtX = s.courtX;
        player.courtY = s.courtY;
      }
    });
    updatePositions();
  }

  function onMove(callback) {
    onMoveCallback = callback;
  }

  function getMode() {
    return currentMode;
  }

  return {
    init,
    updatePositions,
    getState,
    setState,
    onMove,
    getMode,
  };
})();
