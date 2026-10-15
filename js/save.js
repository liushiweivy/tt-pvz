/*
 * save.js — 关卡进度存档（移植 pvs/save.py），存储后端注入。
 * 真机由 main 接 tt.getStorageSync/setStorageSync；测试与 harness 用内存桩。
 * 所有写操作不可变：返回新对象，不改输入。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PvZSave = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var KEY = "pvz_save";

  function defaultSave() {
    return { unlocked: 1, completed: [], music: true };
  }

  // storage: { get(k):string, set(k,v):void }，允许直接抛错（静默回退）
  function loadSave(storage) {
    try {
      var raw = storage.get(KEY);
      if (!raw) return defaultSave();
      var data = JSON.parse(raw);
      var base = defaultSave();
      Object.keys(data).forEach(function (k) { base[k] = data[k]; });
      // 破损字段防护：completed 必须是数组、unlocked 数值
      if (!Array.isArray(base.completed)) base.completed = [];
      if (typeof base.unlocked !== "number") base.unlocked = 1;
      if (typeof base.music !== "boolean") base.music = true;
      return base;
    } catch (e) {
      return defaultSave();
    }
  }

  function writeSave(storage, data) {
    try {
      storage.set(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function recordWin(data, level) {
    var done = (data.completed || []).slice();
    if (done.indexOf(level) < 0) done.push(level);
    return {
      unlocked: Math.max(data.unlocked || 1, level + 1),
      completed: done,
      music: data.music !== false
    };
  }

  function toggleMusic(data) {
    return { unlocked: data.unlocked, completed: data.completed.slice(), music: !data.music };
  }

  return {
    KEY: KEY,
    defaultSave: defaultSave,
    loadSave: loadSave,
    writeSave: writeSave,
    recordWin: recordWin,
    toggleMusic: toggleMusic
  };
});
