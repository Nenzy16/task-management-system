# Task Management System

Aplikasi manajemen tugas *full-stack* yang menggunakan **React** sebagai frontend dan **Express** sebagai backend RESTful API. Fitur mencakup autentikasi JWT dan operasi CRUD lengkap.

## 🛠️ Tech Stack
* **Backend:** Node.js, Express, JWT, bcryptjs
* **Frontend:** React, Vite, Tailwind CSS
* **Docs:** Swagger UI, Postman Collection

---

## 🚀 Cara Menjalankan Aplikasi

Pastikan Anda sudah menginstall **Node.js** di komputer Anda.

### 1. Backend Server
Jalankan perintah berikut di terminal:

```bash
cd backend
npm install
node server.js
# Server akan berjalan di http://localhost:3000
```

### 2. Frontend Client

Buka terminal baru, lalu jalankan:

```bash
cd frontend
npm install
npm run dev
# Client akan berjalan di http://localhost:5173
```

---

## 📖 API Endpoints

### Authentication

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Mendaftar user baru |
| `POST` | `/api/auth/login` | Login & mendapatkan JWT Token |

### Tasks (Memerlukan Token)

Header: `Authorization: Bearer <token>`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/tasks` | Mengambil semua task |
| `GET` | `/api/tasks/:id` | Mengambil detail satu task |
| `POST` | `/api/tasks` | Membuat task baru |
| `PUT` | `/api/tasks/:id` | Update task (keseluruhan) |
| `PATCH` | `/api/tasks/:id` | Update task (parsial/status) |
| `DELETE` | `/api/tasks/:id` | Menghapus task |

---

## 📚 Dokumentasi & Testing

* **Swagger UI:** Akses dokumentasi interaktif di `http://localhost:3000/api-docs` (saat backend berjalan).
* **Postman:** Import file `Task-Management-API.postman_collection.json` yang tersedia di folder `backend/` untuk melakukan testing otomatis.
