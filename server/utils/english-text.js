function normalizeEnglishText(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u2018\u2019\u201B\u02BC\uFF07`´]/g, "'")
    .replace(/[\u201C\u201D\uFF02]/g, '"')
    .replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}
function englishWords(value) {
  return normalizeEnglishText(value).toLowerCase().match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) || [];
}
module.exports = { normalizeEnglishText, englishWords };