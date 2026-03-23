# Migrate From XAMPP MySQL to MySQL Workbench

Important: MySQL Workbench is a database client/GUI.  
Your backend stays PHP. The database server is what changes.

## 1. Install and run MySQL Server

1. Install **MySQL Server 8.x** (if not installed yet).
2. Set a root password during setup.
3. Confirm server is running on port `3306` (or note your custom port).

## 2. Import your database in MySQL Workbench

1. Open MySQL Workbench.
2. Create/open a connection to your MySQL Server.
3. Open [database.sql](/C:/xampp/htdocs/CCS-GSITE-Website/database.sql).
4. Run the script (lightning button) to create schema/tables/data.

## 3. (Recommended) Create an app database user

Run this in Workbench SQL editor:

```sql
CREATE USER IF NOT EXISTS 'cc_gsite_user'@'%' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON cc_gsite_db.* TO 'cc_gsite_user'@'%';
FLUSH PRIVILEGES;
```

## 4. Update backend environment variables

Edit [.env](/C:/xampp/htdocs/CCS-GSITE-Website/.env):

```env
BASE_URL=
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cc_gsite_db
DB_USER=cc_gsite_user
DB_PASS=strong_password_here
DB_CHARSET=utf8mb4
```

If your app is in a subfolder, set `BASE_URL=/your-subfolder`.

## 5. Run backend without XAMPP

From project root:

```powershell
php -S localhost:8000 router.php
```

Open `http://localhost:8000`.

## 6. Verify connection

If DB credentials are correct, login/dashboard pages should load without DB errors.

