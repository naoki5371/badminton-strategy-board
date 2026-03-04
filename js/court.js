// court.js - コート描画モジュール
const Court = (() => {
  const canvas = document.getElementById('court-canvas');
  const ctx = canvas.getContext('2d');

  // バドミントンコートの実際の比率 (メートル)
  const COURT = {
    width: 6.1,       // ダブルスコート幅
    height: 13.4,      // コート長さ
    singlesWidth: 5.18, // シングルスコート幅
    netY: 6.7,         // ネット位置（中央）
    shortServiceLine: 1.98, // ショートサービスライン（ネットからの距離）
    longServiceLineDoubles: 0.76, // ロングサービスライン（エンドラインからの距離）
    centerLineStart: 1.98, // センターライン開始位置（ネットから）
  };

  let courtRect = { x: 0, y: 0, width: 0, height: 0 };
  let scale = 1;
  const PADDING = 20;

  function resize() {
    const container = document.getElementById('court-container');
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    canvas.width = containerW;
    canvas.height = containerH;

    // drawing canvasも同時にリサイズ
    const drawingCanvas = document.getElementById('drawing-canvas');
    drawingCanvas.width = containerW;
    drawingCanvas.height = containerH;

    // コートをコンテナに収まるように計算
    const availableW = containerW - PADDING * 2;
    const availableH = containerH - PADDING * 2;

    const scaleW = availableW / COURT.width;
    const scaleH = availableH / COURT.height;
    scale = Math.min(scaleW, scaleH);

    const courtW = COURT.width * scale;
    const courtH = COURT.height * scale;

    courtRect = {
      x: (containerW - courtW) / 2,
      y: (containerH - courtH) / 2,
      width: courtW,
      height: courtH,
    };

    draw();
  }

  function courtToCanvas(cx, cy) {
    return {
      x: courtRect.x + cx * scale,
      y: courtRect.y + cy * scale,
    };
  }

  function canvasToCourt(px, py) {
    return {
      x: (px - courtRect.x) / scale,
      y: (py - courtRect.y) / scale,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // コート背景（緑）
    ctx.fillStyle = '#2d8a4e';
    ctx.fillRect(courtRect.x, courtRect.y, courtRect.width, courtRect.height);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // 外枠（ダブルスコート）
    ctx.strokeRect(courtRect.x, courtRect.y, courtRect.width, courtRect.height);

    // シングルスサイドライン
    const singlesInset = (COURT.width - COURT.singlesWidth) / 2;
    const sLeft = courtToCanvas(singlesInset, 0);
    const sRight = courtToCanvas(COURT.width - singlesInset, 0);

    ctx.beginPath();
    ctx.moveTo(sLeft.x, courtRect.y);
    ctx.lineTo(sLeft.x, courtRect.y + courtRect.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sRight.x, courtRect.y);
    ctx.lineTo(sRight.x, courtRect.y + courtRect.height);
    ctx.stroke();

    // ネット
    const netPos = courtToCanvas(0, COURT.netY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(courtRect.x, netPos.y);
    ctx.lineTo(courtRect.x + courtRect.width, netPos.y);
    ctx.stroke();
    ctx.lineWidth = 2;

    // ショートサービスライン（上側）
    const ssl1 = courtToCanvas(0, COURT.netY - COURT.shortServiceLine);
    ctx.beginPath();
    ctx.moveTo(courtRect.x, ssl1.y);
    ctx.lineTo(courtRect.x + courtRect.width, ssl1.y);
    ctx.stroke();

    // ショートサービスライン（下側）
    const ssl2 = courtToCanvas(0, COURT.netY + COURT.shortServiceLine);
    ctx.beginPath();
    ctx.moveTo(courtRect.x, ssl2.y);
    ctx.lineTo(courtRect.x + courtRect.width, ssl2.y);
    ctx.stroke();

    // ロングサービスライン（ダブルス用、上側）
    const lsl1 = courtToCanvas(0, COURT.longServiceLineDoubles);
    ctx.beginPath();
    ctx.moveTo(courtRect.x, lsl1.y);
    ctx.lineTo(courtRect.x + courtRect.width, lsl1.y);
    ctx.stroke();

    // ロングサービスライン（ダブルス用、下側）
    const lsl2 = courtToCanvas(0, COURT.height - COURT.longServiceLineDoubles);
    ctx.beginPath();
    ctx.moveTo(courtRect.x, lsl2.y);
    ctx.lineTo(courtRect.x + courtRect.width, lsl2.y);
    ctx.stroke();

    // センターライン（上半分: ショートサービスラインからバックバウンダリーラインまで）
    const center = courtToCanvas(COURT.width / 2, 0);
    const clTopService = courtToCanvas(0, COURT.netY - COURT.shortServiceLine);
    const clTopBack = courtToCanvas(0, 0);

    ctx.beginPath();
    ctx.moveTo(center.x, clTopService.y);
    ctx.lineTo(center.x, clTopBack.y);
    ctx.stroke();

    // センターライン（下半分: ショートサービスラインからバックバウンダリーラインまで）
    const clBottomService = courtToCanvas(0, COURT.netY + COURT.shortServiceLine);
    const clBottomBack = courtToCanvas(0, COURT.height);

    ctx.beginPath();
    ctx.moveTo(center.x, clBottomService.y);
    ctx.lineTo(center.x, clBottomBack.y);
    ctx.stroke();
  }

  function getCourtRect() {
    return { ...courtRect };
  }

  function getScale() {
    return scale;
  }

  function getCourtDimensions() {
    return { ...COURT };
  }

  return {
    resize,
    draw,
    courtToCanvas,
    canvasToCourt,
    getCourtRect,
    getScale,
    getCourtDimensions,
  };
})();
