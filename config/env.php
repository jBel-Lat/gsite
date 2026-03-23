<?php
// Lightweight .env loader (for local development). Render provides env vars directly.

if (!function_exists('loadDotEnv')) {
    function loadDotEnv($filePath) {
        if (!is_readable($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#') {
                continue;
            }

            $equalsPos = strpos($line, '=');
            if ($equalsPos === false) {
                continue;
            }

            $name = trim(substr($line, 0, $equalsPos));
            $value = trim(substr($line, $equalsPos + 1));

            if ($name === '') {
                continue;
            }

            $length = strlen($value);
            if ($length >= 2) {
                $startsWithDouble = $value[0] === '"' && $value[$length - 1] === '"';
                $startsWithSingle = $value[0] === "'" && $value[$length - 1] === "'";
                if ($startsWithDouble || $startsWithSingle) {
                    $value = substr($value, 1, -1);
                }
            }

            if (getenv($name) === false) {
                putenv($name . '=' . $value);
            }
            if (!array_key_exists($name, $_ENV)) {
                $_ENV[$name] = $value;
            }
            if (!array_key_exists($name, $_SERVER)) {
                $_SERVER[$name] = $value;
            }
        }
    }
}

if (!function_exists('env')) {
    function env($key, $default = null) {
        if (array_key_exists($key, $_ENV)) {
            return $_ENV[$key];
        }
        if (array_key_exists($key, $_SERVER)) {
            return $_SERVER[$key];
        }

        $value = getenv($key);
        if ($value === false) {
            return $default;
        }

        return $value;
    }
}

loadDotEnv(dirname(__DIR__) . '/.env');
