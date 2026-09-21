import worker from '../worker/src/index.js';
import { createRaceState, playRaceMove, requestJevMove } from '../assets/js/huarongdao-race.js';

const LOCAL_ORIGIN = 'https://hamsterpark.github.io';
const LOCAL_URL = 'https://desktop.jev-xiangqi.invalid/api/move';
const MAX_KEY_LENGTH = 512;

/** Keep the Jev credential in the main process, never in a file or renderer storage. */
export function createDesktopService() {
  let key = '';
  let busy = false;
  let race = createRaceState();
  let raceGeneration = 0;
  let raceBusy = false;
  let raceController = null;

  return {
    setKey(value) {
      if (typeof value !== 'string') throw new Error('请输入 Jev API Key。');
      const next = value.trim();
      if (!next || next.length > MAX_KEY_LENGTH || /\s/.test(next)) {
        throw new Error('请输入有效的 Jev API Key。');
      }
      key = next;
      return { ok: true };
    },

    clearKey() {
      key = '';
      raceController?.abort();
      return { ok: true };
    },

    hasKey() {
      return Boolean(key);
    },

    startRace() {
      raceGeneration++;
      raceController?.abort();
      raceController = null;
      raceBusy = false;
      race = createRaceState();
      return race;
    },

    playRaceMove(moveId) {
      if (typeof moveId !== 'string' || moveId.length > 16) throw new Error('华容道走法无效。');
      try {
        race = playRaceMove(race, 'player', moveId);
        return race;
      } catch {
        throw new Error('华容道走法无效。');
      }
    },

    async requestRaceMove() {
      if (!key) throw new Error('请先输入 Jev API Key。');
      if (raceBusy) throw new Error('Jev 正在思考，请稍候。');
      if (race.turn !== 'jev' || race.winner) throw new Error('当前不是 Jev 的回合。');
      const currentGeneration = raceGeneration;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      raceController = controller;
      raceBusy = true;
      try {
        const moveId = await requestJevMove(race, key, { signal: controller.signal });
        if (currentGeneration !== raceGeneration) throw new Error('对局已重开。');
        race = playRaceMove(race, 'jev', moveId);
        return { race, moveId };
      } catch (error) {
        if (currentGeneration !== raceGeneration) throw new Error('对局已重开。');
        const message = error instanceof Error ? error.message : '';
        if (controller.signal.aborted) throw new Error('Jev 连接超时或已取消，请重试。');
        if (/\b(?:401|403)\b|invalid.*key|unauthori[sz]ed|无权|密钥无效/i.test(message)) {
          throw new Error('Jev API key 无效或无权访问，请检查密钥。');
        }
        if (/\b429\b|quota|request limit|额度|限额/i.test(message)) {
          throw new Error('Jev 今日额度已用完，请稍后再试。');
        }
        throw new Error('Jev 连接失败，请检查密钥或网络后重试。');
      } finally {
        clearTimeout(timeout);
        if (currentGeneration === raceGeneration) {
          raceBusy = false;
          raceController = null;
        }
      }
    },

    async requestMove(payload) {
      if (!key) throw new Error('请先输入 Jev API Key。');
      if (busy) throw new Error('Jev 正在思考，请稍候。');
      busy = true;
      try {
        // Reuse the Worker: it validates the board, derives legal black moves,
        // constrains Jev to those moves, and filters the response.
        const request = new Request(LOCAL_URL, {
          method: 'POST',
          headers: { Origin: LOCAL_ORIGIN, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const response = await worker.fetch(request, {
          JEV_API_KEY: key,
          ALLOWED_ORIGINS: LOCAL_ORIGIN,
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 429) throw new Error(data.error || 'Jev 今日额度已用完，请稍后再试。');
          if (response.status === 401) throw new Error('Jev API key 无效或无权访问，请检查密钥。');
          if (response.status === 400 || response.status === 422) throw new Error('棋局数据无效，请重新开局。');
          throw new Error('Jev 连接失败，请检查密钥或网络后重试。');
        }
        return data;
      } catch (error) {
        if (error instanceof Error && /^(请先输入|Jev 正在思考|Jev 今日额度|Jev API key 无效|棋局数据无效|Jev 连接失败)/.test(error.message)) {
          throw error;
        }
        throw new Error('Jev 连接失败，请检查密钥或网络后重试。');
      } finally {
        busy = false;
      }
    },
  };
}
