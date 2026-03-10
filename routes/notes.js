const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

// Not ekleme formu
router.get('/:investorId(\\d+)/notes/add', requireAuth, async (req, res) => {
  try {
    const investorResult = await pool.query(
      'SELECT * FROM investors WHERE id = $1',
      [req.params.investorId]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).render('error', { title: 'Bulunamadı', message: 'Yatırımcı bulunamadı.' });
    }

    const stepResult = await pool.query(
      'SELECT COALESCE(MAX(step_number), 0) + 1 AS next_step FROM meeting_notes WHERE investor_id = $1',
      [req.params.investorId]
    );

    res.render('notes/add', {
      investor: investorResult.rows[0],
      nextStep: stepResult.rows[0].next_step,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Bir hata oluştu.' });
  }
});

// Not ekle
router.post('/:investorId(\\d+)/notes/add', requireAuth, async (req, res) => {
  const { title, content, meeting_date, step_number } = req.body;

  if (!content || !content.trim()) {
    const investorResult = await pool.query('SELECT * FROM investors WHERE id = $1', [req.params.investorId]);
    return res.render('notes/add', {
      investor: investorResult.rows[0],
      nextStep: step_number || 1,
      error: 'Not içeriği zorunludur.'
    });
  }

  try {
    await pool.query(
      `INSERT INTO meeting_notes (investor_id, step_number, title, content, meeting_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.params.investorId,
        parseInt(step_number) || 1,
        title?.trim() || null,
        content.trim(),
        meeting_date || null,
        req.session.user.id
      ]
    );
    req.session.flash = { type: 'success', message: 'Not başarıyla eklendi.' };
    res.redirect(`/investors/${req.params.investorId}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Not eklenirken hata oluştu.' });
  }
});

// Not düzenleme formu
router.get('/:investorId(\\d+)/notes/:noteId(\\d+)/edit', requireAuth, async (req, res) => {
  try {
    const [investorResult, noteResult] = await Promise.all([
      pool.query('SELECT * FROM investors WHERE id = $1', [req.params.investorId]),
      pool.query('SELECT * FROM meeting_notes WHERE id = $1 AND investor_id = $2', [req.params.noteId, req.params.investorId])
    ]);

    if (investorResult.rows.length === 0 || noteResult.rows.length === 0) {
      return res.status(404).render('error', { title: 'Bulunamadı', message: 'Kayıt bulunamadı.' });
    }

    res.render('notes/edit', {
      investor: investorResult.rows[0],
      note: noteResult.rows[0],
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Bir hata oluştu.' });
  }
});

// Not güncelle
router.post('/:investorId(\\d+)/notes/:noteId(\\d+)/edit', requireAuth, async (req, res) => {
  const { title, content, meeting_date, step_number } = req.body;

  if (!content || !content.trim()) {
    const [investorResult, noteResult] = await Promise.all([
      pool.query('SELECT * FROM investors WHERE id = $1', [req.params.investorId]),
      pool.query('SELECT * FROM meeting_notes WHERE id = $1', [req.params.noteId])
    ]);
    return res.render('notes/edit', {
      investor: investorResult.rows[0],
      note: noteResult.rows[0],
      error: 'Not içeriği zorunludur.'
    });
  }

  try {
    await pool.query(
      `UPDATE meeting_notes
       SET title = $1, content = $2, meeting_date = $3, step_number = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND investor_id = $6`,
      [
        title?.trim() || null,
        content.trim(),
        meeting_date || null,
        parseInt(step_number) || 1,
        req.params.noteId,
        req.params.investorId
      ]
    );
    req.session.flash = { type: 'success', message: 'Not güncellendi.' };
    res.redirect(`/investors/${req.params.investorId}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Not güncellenirken hata oluştu.' });
  }
});

// Not sil
router.post('/:investorId(\\d+)/notes/:noteId(\\d+)/delete', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM meeting_notes WHERE id = $1 AND investor_id = $2',
      [req.params.noteId, req.params.investorId]
    );
    req.session.flash = { type: 'success', message: 'Not silindi.' };
    res.redirect(`/investors/${req.params.investorId}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Not silinirken hata oluştu.' });
  }
});

module.exports = router;
