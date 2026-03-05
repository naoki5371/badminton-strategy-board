// app.js - メインアプリケーション
const App = (() => {
  let currentMode = 'singles';

  function init() {
    // 各モジュール初期化
    Court.resize();
    Players.init(currentMode);
    Drawing.init();
    Recorder.init();

    // ウィンドウリサイズ対応
    window.addEventListener('resize', () => {
      Court.resize();
      Players.updatePositions();
      Drawing.redraw();
    });

    // モード切り替え
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode === currentMode) return;

        document.querySelector('.mode-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentMode = mode;

        Players.init(mode);
        Drawing.clear();
        Recorder.reset();
      });
    });

    // 元に戻す
    document.getElementById('undo-btn').addEventListener('click', () => {
      Drawing.undo();
    });

    // 描画クリア
    document.getElementById('clear-drawing-btn').addEventListener('click', () => {
      Drawing.clear();
    });

    // 保存ボタン
    document.getElementById('save-btn').addEventListener('click', showSaveDialog);
    document.getElementById('save-confirm').addEventListener('click', saveStrategy);
    document.getElementById('save-cancel').addEventListener('click', () => {
      document.getElementById('save-dialog').classList.add('hidden');
    });

    // 読み込みボタン
    document.getElementById('load-btn').addEventListener('click', showLoadDialog);
    document.getElementById('load-cancel').addEventListener('click', () => {
      document.getElementById('load-dialog').classList.add('hidden');
    });

    // 新規ボタン
    document.getElementById('new-btn').addEventListener('click', () => {
      if (confirm('現在の内容をクリアして新規作成しますか？')) {
        newStrategy();
      }
    });

    // 書き出しボタン
    document.getElementById('export-btn').addEventListener('click', () => {
      Storage.exportAllStrategies();
    });

    // 取り込みボタン
    const importFileInput = document.getElementById('import-file-input');
    document.getElementById('import-btn').addEventListener('click', () => {
      importFileInput.click();
    });
    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const count = await Storage.importStrategies(file);
        alert(`${count}件の戦略を取り込みました`);
      } catch (err) {
        alert(err.message);
      }
      importFileInput.value = '';
    });

    // drawing canvasは常にポインターイベント有効（フリーハンド描画用）
    document.getElementById('drawing-canvas').style.pointerEvents = 'auto';
  }

  function showSaveDialog() {
    const dialog = document.getElementById('save-dialog');
    document.getElementById('save-title').value = '';
    document.getElementById('save-memo').value = '';
    dialog.classList.remove('hidden');
  }

  function saveStrategy() {
    const title = document.getElementById('save-title').value.trim();
    if (!title) {
      alert('タイトルを入力してください');
      return;
    }
    const memo = document.getElementById('save-memo').value.trim();

    const data = {
      mode: currentMode,
      players: Players.getState(),
      drawings: Drawing.getState(),
      recorder: Recorder.getState(),
    };

    Storage.saveStrategy(title, memo, data);
    document.getElementById('save-dialog').classList.add('hidden');
    alert('保存しました');
  }

  function showLoadDialog() {
    const dialog = document.getElementById('load-dialog');
    const list = document.getElementById('load-list');
    const strategies = Storage.getAllStrategies();

    if (strategies.length === 0) {
      list.innerHTML = '<div class="load-empty">保存された戦略はありません</div>';
    } else {
      list.innerHTML = strategies.map(s => `
        <div class="load-item" data-id="${s.id}">
          <div class="load-item-info">
            <div class="load-item-title">${escapeHtml(s.title)}</div>
            <div class="load-item-meta">${Storage.formatDate(s.createdAt)} | ${getModeLabel(s.data.mode)}</div>
            ${s.memo ? `<div class="load-item-memo">${escapeHtml(s.memo)}</div>` : ''}
          </div>
          <button class="load-item-delete" data-delete-id="${s.id}" title="削除">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
          </button>
        </div>
      `).join('');

      // 読み込みクリック
      list.querySelectorAll('.load-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.closest('.load-item-delete')) return;
          loadStrategy(item.dataset.id);
          dialog.classList.add('hidden');
        });
      });

      // 削除クリック
      list.querySelectorAll('.load-item-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.dataset.deleteId;
          if (confirm('この戦略を削除しますか？')) {
            Storage.deleteStrategy(id);
            showLoadDialog(); // リスト更新
          }
        });
      });
    }

    dialog.classList.remove('hidden');
  }

  function loadStrategy(id) {
    const strategy = Storage.loadStrategy(id);
    if (!strategy) return;

    const data = strategy.data;

    // モード切り替え
    currentMode = data.mode;
    document.querySelector('.mode-btn.active').classList.remove('active');
    document.querySelector(`.mode-btn[data-mode="${data.mode}"]`).classList.add('active');

    // 状態復元
    Players.init(data.mode);
    Players.setState(data.players);
    Drawing.setState(data.drawings);

    if (data.recorder) {
      Recorder.setState(data.recorder);
    } else {
      Recorder.reset();
    }
  }

  function newStrategy() {
    Drawing.clear();
    Players.init(currentMode);
    Recorder.reset();
  }

  function getModeLabel(mode) {
    const labels = {
      singles: 'シングルス',
      doubles: 'ダブルス',
      mixed: 'ミックス',
    };
    return labels[mode] || mode;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    init,
  };
})();

// アプリ起動
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
