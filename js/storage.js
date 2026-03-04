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

  return {
    getAllStrategies,
    saveStrategy,
    loadStrategy,
    deleteStrategy,
    formatDate,
  };
})();
