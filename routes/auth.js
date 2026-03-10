const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../database');
const { requireAuth } = require('../middleware/auth');

// Giriş sayfası
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/investors');
  res.render('login', { error: null });
});

// Giriş işlemi
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', { error: 'Kullanıcı adı ve şifre zorunludur.' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.render('login', { error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.render('login', { error: 'Kullanıcı adı veya şifre hatalı.' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name
    };

    const returnTo = req.session.returnTo || '/investors';
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Bir hata oluştu. Lütfen tekrar deneyin.' });
  }
});

// Çıkış
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Profil sayfası
router.get('/profile', requireAuth, (req, res) => {
  res.render('profile', { error: null, success: null });
});

// Şifre değiştir
router.post('/profile/password', requireAuth, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;

  if (!current_password || !new_password || !confirm_password) {
    return res.render('profile', { error: 'Tüm alanları doldurun.', success: null });
  }

  if (new_password.length < 6) {
    return res.render('profile', { error: 'Yeni şifre en az 6 karakter olmalıdır.', success: null });
  }

  if (new_password !== confirm_password) {
    return res.render('profile', { error: 'Yeni şifreler eşleşmiyor.', success: null });
  }

  try {
    const { rows } = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.session.user.id]
    );

    const isValid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!isValid) {
      return res.render('profile', { error: 'Mevcut şifre hatalı.', success: null });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newHash, req.session.user.id]
    );

    res.render('profile', { error: null, success: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    console.error(err);
    res.render('profile', { error: 'Bir hata oluştu.', success: null });
  }
});

module.exports = router;
