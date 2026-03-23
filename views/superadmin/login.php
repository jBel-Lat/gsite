<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Admin Login - Organization Management System</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?= BASE_URL ?>/assets/css/style.css">
    <style>
        body {
            background: linear-gradient(135deg, #2c0b3f 0%, #1e1b4b 100%); /* distinct color for superadmin */
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            font-family: 'Inter', sans-serif;
            color: #fff;
        }
        .login-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            padding: 40px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            width: 100%;
            max-width: 400px;
        }
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .login-header h1 {
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 10px;
            color: #f8fafc;
        }
        .login-header p {
            color: #94a3b8;
            font-size: 14px;
            margin: 0;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: #cbd5e1;
            font-weight: 500;
        }
        .form-group input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 15px;
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .form-group input:focus {
            outline: none;
            border-color: #8b5cf6;
            background: rgba(0, 0, 0, 0.3);
            box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        .btn-login {
            width: 100%;
            padding: 14px;
            background: #8b5cf6;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s ease;
            font-family: 'Inter', sans-serif;
            margin-top: 10px;
        }
        .btn-login:hover {
            background: #7c3aed;
        }
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>

<div class="login-container">
    <div class="login-header">
        <h1>Super Admin Control</h1>
        <p>System Management</p>
    </div>

    <?php if (!empty($error)): ?>
        <div class="error-message">
            <?= Auth::sanitize($error) ?>
        </div>
    <?php endif; ?>

    <form action="<?= BASE_URL ?>/superadmin/authenticate" method="POST">
        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
        
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" required autocomplete="off" placeholder="Enter superadmin username">
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="Enter password">
        </div>

        <button type="submit" class="btn-login">Secure Login</button>
    </form>
</div>

</body>
</html>
