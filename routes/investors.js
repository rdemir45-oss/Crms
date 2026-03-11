const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

// Tüm yatırımcıları listele
router.get('/', requireAuth, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    let query, params;

    if (search) {
      query = `
        SELECT i.*, u.full_name AS creator_name,
               COUNT(mn.id)::int AS note_count,
               (SELECT status FROM meeting_notes WHERE investor_id = i.id ORDER BY created_at DESC LIMIT 1) AS latest_status
        FROM investors i
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN meeting_notes mn ON i.id = mn.investor_id
        WHERE LOWER(i.name) LIKE $1
           OR LOWER(i.surname) LIKE $1
           OR i.phone LIKE $1
           OR LOWER(i.email) LIKE $1
        GROUP BY i.id, u.full_name
        ORDER BY i.created_at DESC
      `;
      params = [`%${search.toLowerCase()}%`];
    } else {
      query = `
        SELECT i.*, u.full_name AS creator_name,
               COUNT(mn.id)::int AS note_count,
               (SELECT status FROM meeting_notes WHERE investor_id = i.id ORDER BY created_at DESC LIMIT 1) AS latest_status
        FROM investors i
        LEFT JOIN users u ON i.created_by = u.id
        LEFT JOIN meeting_notes mn ON i.id = mn.investor_id
        GROUP BY i.id, u.full_name
        ORDER BY i.created_at DESC
      `;
      params = [];
    }

    const { rows } = await pool.query(query, params);
    res.render('investors/list', { investors: rows, search });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Yatırımcılar yüklenirken hata oluştu.' });
  }
});

// Yeni yatırımcı formu
router.get('/add', requireAuth, (req, res) => {
  res.render('investors/add', { error: null });
});

// Yeni yatırımcı ekle
router.post('/add', requireAuth, async (req, res) => {
  const { name, surname, phone, email } = req.body;

  if (!name || !surname) {
    return res.render('investors/add', { error: 'Ad ve soyad alanları zorunludur.' });
  }

  try {
    await pool.query(
      'INSERT INTO investors (name, surname, phone, email, created_by) VALUES ($1, $2, $3, $4, $5)',
      [
        name.trim(),
        surname.trim(),
        phone?.trim() || null,
        email?.trim() || null,
        req.session.user.id
      ]
    );
    req.session.flash = { type: 'success', message: `${name} ${surname} başarıyla eklendi.` };
    res.redirect('/investors');
  } catch (err) {
    console.error(err);
    res.render('investors/add', { error: 'Yatırımcı eklenirken hata oluştu.' });
  }
});

// Yatırımcı detayı
router.get('/:id(\\d+)', requireAuth, async (req, res) => {
  try {
    const investorResult = await pool.query(
      `SELECT i.*, u.full_name AS creator_name
       FROM investors i
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (investorResult.rows.length === 0) {
      return res.status(404).render('error', { title: 'Bulunamadı', message: 'Yatırımcı bulunamadı.' });
    }

    const notesResult = await pool.query(
      `SELECT mn.*, u.full_name AS added_by_name
       FROM meeting_notes mn
       LEFT JOIN users u ON mn.created_by = u.id
       WHERE mn.investor_id = $1
       ORDER BY mn.step_number ASC, mn.created_at ASC`,
      [req.params.id]
    );

    res.render('investors/detail', {
      investor: investorResult.rows[0],
      notes: notesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Yatırımcı bilgileri yüklenirken hata oluştu.' });
  }
});

// Düzenleme formu
router.get('/:id(\\d+)/edit', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM investors WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).render('error', { title: 'Bulunamadı', message: 'Yatırımcı bulunamadı.' });
    }
    res.render('investors/edit', { investor: rows[0], error: null });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Yatırımcı bilgileri yüklenirken hata oluştu.' });
  }
});

// Güncelle
router.post('/:id(\\d+)/edit', requireAuth, async (req, res) => {
  const { name, surname, phone, email } = req.body;

  if (!name || !surname) {
    const { rows } = await pool.query('SELECT * FROM investors WHERE id = $1', [req.params.id]);
    return res.render('investors/edit', { investor: rows[0], error: 'Ad ve soyad alanları zorunludur.' });
  }

  try {
    await pool.query(
      'UPDATE investors SET name = $1, surname = $2, phone = $3, email = $4 WHERE id = $5',
      [name.trim(), surname.trim(), phone?.trim() || null, email?.trim() || null, req.params.id]
    );
    req.session.flash = { type: 'success', message: 'Yatırımcı bilgileri güncellendi.' };
    res.redirect(`/investors/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Güncelleme sırasında hata oluştu.' });
  }
});

// Sil
router.post('/:id(\\d+)/delete', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT name, surname FROM investors WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.redirect('/investors');

    await pool.query('DELETE FROM investors WHERE id = $1', [req.params.id]);
    req.session.flash = { type: 'success', message: `${rows[0].name} ${rows[0].surname} silindi.` };
    res.redirect('/investors');
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Hata', message: 'Silme sırasında hata oluştu.' });
  }
});

module.exports = router;
