<?php
require_once 'config/database.php';
require_once 'models/User.php';

$u = new User();
if (method_exists($u, 'updateProfile')) {
    echo "Method updateProfile exists\n";
} else {
    echo "Method updateProfile does NOT exist\n";
    $rc = new ReflectionClass('User');
    echo "User class defined in: " . $rc->getFileName() . "\n";
    echo "Methods: " . implode(', ', array_map(function($m){ return $m->name; }, $rc->getMethods())) . "\n";
}
?>
