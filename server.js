require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const { pool, initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const investorRoutes = require('./routes/investors');
const noteRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'crm-gizli-2024-degistir',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Tüm view'lara user ve flash mesajı ilet
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  if (req.session.flash) {
    delete req.session.flash;
  }
  next();
});

// Ana sayfa yönlendirmesi
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/investors');
  } else {
    res.redirect('/login');
  }
});

// Routes
app.use('/', authRoutes);
app.use('/investors', investorRoutes);
app.use('/investors', noteRoutes);

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Sayfa Bulunamadı',
    message: 'Aradığınız sayfa bulunamadı.'
  });
});

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Sunucu Hatası',
    message: 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
  });
});

// Veritabanını başlat, sonra sunucuyu çalıştır
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Sunucu ${PORT} portunda çalışıyor`);
    });
  })
  .catch(err => {
    console.error('Veritabanı başlatılamadı:', err);
    process.exit(1);
  });
