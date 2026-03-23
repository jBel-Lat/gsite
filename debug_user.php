<?php
require_once 'config/database.php';
require_once 'models/User.php';

$u = new User();
echo "Class 'User' is defined.\n";
$reflection = new ReflectionClass('User');
echo "Defined in: " . $reflection->getFileName() . "\n";

if (method_exists($u, 'updateProfileDetails')) {
    echo "Method 'updateProfileDetails' EXISTS.\n";
} else {
    echo "Method 'updateProfileDetails' does NOT exist.\n";
}

echo "\nAll loaded files:\n";
foreach (get_included_files() as $file) {
    echo "- $file\n";
}
?>
