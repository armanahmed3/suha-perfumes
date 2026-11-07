<?php
header('Content-Type: application/json');
echo json_encode([
    'php_version' => PHP_VERSION,
    'sqlite3' => extension_loaded('sqlite3'),
    'pdo_sqlite' => extension_loaded('pdo_sqlite'),
    'mod_rewrite' => in_array('mod_rewrite', apache_get_modules() ?? []),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? '',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
]);

