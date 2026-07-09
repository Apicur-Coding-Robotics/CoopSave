<?php
// register.php
require 'db.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!empty($username) && !empty($email) && !empty($password)) {
        // Hash the password securely
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

        try {
            // Prepared statement to prevent SQL injection
            $stmt = $pdo->prepare("INSERT INTO customer (username, email, password) VALUES (?, ?, ?)");
            $stmt->execute([$username, $email, $hashedPassword]);
            
            $message = "Registration successful! You can now log in.";
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) { // Duplicate entry error code
                $message = "Username or Email already exists.";
            } else {
                $message = "An error occurred: " . $e->getMessage();
            }
        }
    } else {
        $message = "Please fill in all fields.";
    }
}
?>

<!DOCTYPE html>
<html>
<head><title>Customer Registration</title></head>
<body>
    <h2>Register</h2>
    <?php if (!empty($message)) echo "<p><strong>$message</strong></p>"; ?>
    
    <form method="POST" action="register.php">
        <input type="text" name="username" placeholder="Username" required><br><br>
        <input type="email" name="email" placeholder="Email" required><br><br>
        <input type="password" name="password" placeholder="Password" required><br><br>
        <button type="submit">Register</button>
    </form>
</body>
</html>
