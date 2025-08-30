const express = require('express');
const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    // Replace with actual GenAI API usage
    const result = await ai.generateText({ prompt });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
