const db = require('../config/db');

const getKnowledge = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM chatbot_knowledge ORDER BY category, question');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const addKnowledge = async (req, res) => {
  const { category, question, answer, keywords } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO chatbot_knowledge (category, question, answer, keywords) VALUES ($1, $2, $3, $4) RETURNING *',
      [category, question, answer, keywords]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const updateKnowledge = async (req, res) => {
  const { id } = req.params;
  const { category, question, answer, keywords } = req.body;
  try {
    const result = await db.query(
      'UPDATE chatbot_knowledge SET category = $1, question = $2, answer = $3, keywords = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [category, question, answer, keywords, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Knowledge base entry not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

const deleteKnowledge = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM chatbot_knowledge WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Knowledge base entry not found' });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

module.exports = { getKnowledge, addKnowledge, updateKnowledge, deleteKnowledge };
