// Отправка в Discord через вебхук прямо из браузера (картинка + подпись).
// Текстовые уведомления о проверке/входах шлёт сама база (pg_net), здесь — ручная публикация готовой работы.
export const DISCORD_EVENTS = {
  logins: 'Входы на сайт и неудачные попытки',
  tokens: 'Выдача токенов',
  exports: 'Скачивание и копирование работ',
};

export const isWebhook = (url) => /^https:\/\/(?:ptb\.|canary\.)?(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+/.test(url || '');

export async function postToDiscord(url, { content = '', file = null, filename = 'cnd.png' } = {}) {
  if (!isWebhook(url)) throw new Error('Это не похоже на ссылку вебхука Discord');
  const body = new FormData();
  body.append('payload_json', JSON.stringify({ username: 'CND Редактор', content: content.slice(0, 1900) }));
  if (file) body.append('files[0]', file, filename);
  const res = await fetch(`${url}?wait=true`, { method: 'POST', body });
  if (!res.ok) {
    let msg = `Discord ответил ошибкой ${res.status}`;
    try { const j = await res.json(); if (j.message) msg += `: ${j.message}`; } catch { /* без тела */ }
    throw new Error(msg);
  }
  return true;
}
