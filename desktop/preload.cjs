const { contextBridge, ipcRenderer } = require('electron');

async function invoke(channel, value) {
  const result = await ipcRenderer.invoke(channel, value);
  if (!result?.ok) throw new Error(result?.error || '操作失败，请重试。');
  return result.value;
}

contextBridge.exposeInMainWorld('jevDesktop', Object.freeze({
  setKey: (key) => invoke('jev:set-key', key),
  clearKey: () => invoke('jev:clear-key'),
  hasKey: () => invoke('jev:has-key'),
  requestMove: (payload) => invoke('jev:request-move', payload),
  startRace: () => invoke('jev:start-race'),
  playRaceMove: (moveId) => invoke('jev:play-race-move', moveId),
  requestRaceMove: () => invoke('jev:request-race-move'),
}));
