# CareerLink Backend

Untuk sementara, login dan registrasi di-handle ke dalam file `users.json`

## Endpoints

### POST /register
Endpoint untuk registrasi pengguna baru.
```
{
  "username": "string (min. 3 karakter)",
  "password": "string (min. 6 karakter)"
}
```

### POST /login
Endpoint untuk login pengguna.
```
{
  "username": "string",
  "password": "string"
}
```

### GET /profile
Endpoint terproteksi untuk mendapatkan profil pengguna. Membutuhkan token JWT.

### GET /health
Endpoint untuk mengecek status server.

## Instalasi dan Penggunaan

1. Clone repository ini
2. Install dependencies:
   ```
   npm install
   ```
3. Buat file `.env` dengan isi:
   ```
   JWT_SECRET=your_jwt_secret_here
   PORT=3000
   ```
4. Jalankan server:
   ```
   npm start
   ```

## Validasi
- Username: minimal 3 karakter
- Password: minimal 6 karakter
- Token JWT expires dalam 2 jam

## Error Handling
Server dilengkapi dengan penanganan error untuk:
- Input validasi
- Autentikasi
- Server errors
- 404 Not Found