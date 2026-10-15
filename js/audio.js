/*
 * audio.js — 音频上下文适配（M0 最小版：只负责拿到时钟与上下文，M4 起搬合成音效）。
 * tt.getAudioContext()（基础库 ≥1.34.0，W3C 子集：无 BiquadFilter/Compressor/Convolver）
 * 微信 wx.createWebAudioContext()；浏览器 window.AudioContext。
 * 任何分支失败都静默降级（返回 false），游戏不得因音频环境缺失而崩。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PvZAudio = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ctx = null;
  var createFailed = false; // 瞬时失败（冷启动音频服务未就绪等）不永久封死，可由 resetFailed 放行重试

  function hostApi() {
    if (typeof tt !== "undefined" && tt) return tt;
    if (typeof wx !== "undefined" && wx) return wx;
    return null;
  }

  function isAudioSupported() {
    if (ctx) return true;
    if (createFailed) return false;
    var api = hostApi();
    if (api && typeof api.getAudioContext === "function") return true;        // 抖音
    if (api && typeof api.createWebAudioContext === "function") return true;  // 微信
    if (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) return true;
    return false;
  }

  /** 首次调用/从后台回来时尝试创建或 resume。返回是否有可用上下文。 */
  function ensure() {
    try {
      if (!ctx && !createFailed) {
        var api = hostApi();
        if (api && typeof api.getAudioContext === "function") {
          ctx = api.getAudioContext();
        } else if (api && typeof api.createWebAudioContext === "function") {
          ctx = api.createWebAudioContext();
        } else if (typeof window !== "undefined") {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (AC) ctx = new AC();
        }
        if (!ctx) createFailed = true;
      }
      if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume();
      }
    } catch (e) {
      createFailed = true;
      ctx = null;
    }
    return !!ctx;
  }

  /** 音频时钟秒；无音频环境时回退墙上时钟（Node 测试/极端降级） */
  function currentTime() {
    if (ctx) return ctx.currentTime;
    if (typeof performance !== "undefined" && performance.now) return performance.now() / 1000;
    return Date.now() / 1000;
  }

  function getContext() { return ctx; }

  /** onShow 回前台时调用：放行一次创建重试（后台期间音频服务可能已恢复） */
  function resetFailed() { createFailed = false; }

  return {
    isAudioSupported: isAudioSupported,
    ensure: ensure,
    resetFailed: resetFailed,
    currentTime: currentTime,
    getContext: getContext
  };
});
