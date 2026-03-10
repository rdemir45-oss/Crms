# Yatırımcı CRM — Railway Deployment Kılavuzu

## Railway'e Deploy Etme

### 1. Gereksinimler
- [Railway](https://railway.app) hesabı
- [GitHub](https://github.com) hesabı
- Git kurulu olmalı

---

### 2. Projeyi GitHub'a Yükle

```bash
cd /Users/recepdemir/CRM
git init
git add .
git commit -m "İlk commit: Yatırımcı CRM"
# GitHub'da yeni repo oluşturun, ardından:
git remote add origin https://github.com/KULLANICI/crm.git
git push -u origin main
```

---

### 3. Railway Projesi Oluştur

1. [railway.app](https://railway.app) adresine girin ve **New Project** tıklayın
2. **Deploy from GitHub repo** seçin
3. Projenizi seçin
4. Railway otomatik olarak Node.js projesini tanıyacak

---

### 4. PostgreSQL Veritabanı Ekle

1. Railway projenizde **+ New** → **Database** → **PostgreSQL** seçin
2. PostgreSQL oluşturulduktan sonra **Variables** sekmesinden `DATABASE_URL` otomatik olarak projenize eklenir

---

### 5. Ortam Değişkenlerini Ayarla

Railway projenizde **Variables** sekmesine gidin ve şunları ekleyin:

| Değişken | Değer |
|---|---|
| `SESSION_SECRET` | Rastgele güçlü bir şifre (en az 32 karakter) |
| `NODE_ENV` | `production` |
| `ADMIN1_USERNAME` | İstediğiniz kullanıcı adı |
| `ADMIN1_PASSWORD` | Güçlü bir şifre |
| `ADMIN1_NAME` | Admin 1'in tam adı |
| `ADMIN2_USERNAME` | İstediğiniz kullanıcı adı |
| `ADMIN2_PASSWORD` | Güçlü bir şifre |
| `ADMIN2_NAME` | Admin 2'nin tam adı |
| `ADMIN3_USERNAME` | İstediğiniz kullanıcı adı |
| `ADMIN3_PASSWORD` | Güçlü bir şifre |
| `ADMIN3_NAME` | Admin 3'ün tam adı |

> **Not:** `DATABASE_URL` Railway tarafından otomatik eklenir, elle girmenize gerek yok.

---

### 6. Deploy Et

Değişkenleri kaydettikten sonra Railway otomatik olarak deploy eder.
**Deployments** sekmesinden canlı logları takip edebilirsiniz.

---

### 7. Siteye Erişim

Railway projenizde **Settings** → **Domains** bölümünden size verilen URL'ye erişin.
Veya özel domain ekleyebilirsiniz.

---

## Varsayılan Admin Bilgileri (env ayarlanmadıysa)

| Kullanıcı Adı | Şifre |
|---|---|
| `admin1` | `Admin123!` |
| `admin2` | `Admin123!` |
| `admin3` | `Admin123!` |

> **ÖNEMLİ:** Deploy sonrası her admin kendi şifresini profil sayfasından değiştirmelidir!

---

## Özellikler

- **Yatırımcı Yönetimi:** Ad, soyad, telefon, e-posta kaydı
- **Görüşme Notları:** Adım adım not sistemi (tarih, başlık, içerik)
- **3 Admin:** Her biri bağımsız giriş yapabilir, tüm verilere erişebilir
- **Arama:** Yatırımcıları ad, soyad veya telefona göre arama
- **Şifre Değiştirme:** Her admin kendi şifresini değiştirebilir
