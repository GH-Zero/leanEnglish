const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { initDatabase, pool, closeDatabase } = require('./database');

const DATA_FILE = path.join(__dirname, 'data', 'words-36000.json.gz');
const BATCH_SIZE = 250;

function readWordPackage() {
  const compressed = fs.readFileSync(DATA_FILE);
  const payload = JSON.parse(zlib.gunzipSync(compressed).toString('utf8'));
  if (!payload.metadata || payload.metadata.total !== 36000 || !Array.isArray(payload.words)) {
    throw new Error('36,000 词库数据包格式不正确');
  }
  if (payload.words.length !== 36000) {
    throw new Error(`词库数量不正确：${payload.words.length}`);
  }
  return payload;
}

async function importWords() {
  await initDatabase();
  const payload = readWordPackage();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM words WHERE source = 'ECDICT'");

    const sql = `
      INSERT INTO words
        (word, phonetic_us, phonetic_uk, chinese, example, level, tag, category, frequency_rank, source, sort_order)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        phonetic_us = VALUES(phonetic_us),
        phonetic_uk = VALUES(phonetic_uk),
        chinese = VALUES(chinese),
        example = VALUES(example),
        level = VALUES(level),
        tag = VALUES(tag),
        category = VALUES(category),
        frequency_rank = VALUES(frequency_rank),
        source = VALUES(source),
        sort_order = VALUES(sort_order)
    `;

    for (let offset = 0; offset < payload.words.length; offset += BATCH_SIZE) {
      const batch = payload.words.slice(offset, offset + BATCH_SIZE).map((word) => [
        word.word,
        word.phonetic_us || null,
        word.phonetic_uk || null,
        word.chinese || null,
        word.example || null,
        word.level,
        word.tag,
        word.category,
        word.frequency_rank || null,
        word.source,
        word.sort_order
      ]);
      await connection.query(sql, [batch]);
      if ((offset + batch.length) % 5000 === 0) {
        console.log(`已导入 ${offset + batch.length} / ${payload.words.length}`);
      }
    }

    const [[totals]] = await connection.query(
      'SELECT COUNT(*) AS total, COUNT(DISTINCT word) AS unique_words FROM words'
    );
    if (totals.total !== 36000 || totals.unique_words !== 36000) {
      throw new Error(`导入校验失败：总数 ${totals.total}，唯一词数 ${totals.unique_words}`);
    }

    const [categories] = await connection.query(
      'SELECT category, COUNT(*) AS count FROM words GROUP BY category ORDER BY count DESC'
    );
    await connection.commit();
    console.log(JSON.stringify({ total: totals.total, categories }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

importWords()
  .catch((error) => {
    console.error('36,000 词库导入失败:', error);
    process.exitCode = 1;
  })
  .finally(closeDatabase);