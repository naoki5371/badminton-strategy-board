// storage.js - 保存・読み込みモジュール
const Storage = (() => {
  const STORAGE_KEY = 'badminton-strategy-data';

  function getAllStrategies() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function saveStrategy(title, memo, strategyData) {
    const strategies = getAllStrategies();
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      memo,
      createdAt: new Date().toISOString(),
      data: strategyData,
    };
    strategies.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
    return entry;
  }

  function loadStrategy(id) {
    const strategies = getAllStrategies();
    return strategies.find(s => s.id === id) || null;
  }

  function deleteStrategy(id) {
    let strategies = getAllStrategies();
    strategies = strategies.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies));
  }

  function formatDate(isoString) {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${y}/${m}/${day} ${h}:${min}`;
  }

  function exportAllStrategies() {
    const strategies = getAllStrategies();
    if (strategies.length === 0) {
      alert('書き出すデータがありません');
      return;
    }
    const json = JSON.stringify(strategies, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'badminton-strategies-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importStrategies(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (!Array.isArray(imported)) {
            reject(new Error('不正なファイル形式です'));
            return;
          }
          const existing = getAllStrategies();
          const existingIds = new Set(existing.map(s => s.id));
          let addedCount = 0;
          imported.forEach(item => {
            if (item.id && item.title && item.data && !existingIds.has(item.id)) {
              existing.push(item);
              addedCount++;
            }
          });
          existing.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
          resolve(addedCount);
        } catch (err) {
          reject(new Error('ファイルの読み込みに失敗しました'));
        }
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsText(file);
    });
  }

  return {
    getAllStrategies,
    saveStrategy,
    loadStrategy,
    deleteStrategy,
    formatDate,
    exportAllStrategies,
    importStrategies,
  };
})();
