
<?php
// login.php
session_start();
require 'db.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if (!empty($username) && !empty($password)) {
        // Fetch user from the database
        $stmt = $pdo->prepare("SELECT * FROM customer WHERE username = ?");
        $stmt->execute([$username]);
        $customer = $stmt->fetch();

        // Verify password against the hashed password in DB
        if ($customer && password_verify($password, $customer['password'])) {
            // Password is correct, start the session
            $_SESSION['customer_id'] = $customer['id'];
            $_SESSION['username'] = $customer['username'];
            
            $message = "Login successful! Welcome, " . htmlspecialchars($customer['username']) . ".";
            // Redirect to a dashboard if needed: header("Location: dashboard.php"); exit;
        } else {
            $message = "Invalid username or password.";
        }
    } else {
        $message = "Please fill in all fields.";
    }
}
?>

<!DOCTYPE html>
<html>
<head><title>Customer Login</title></head>
<body>
    <h2>Login</h2>
    <?php if (!empty($message)) echo "<p><strong>$message</strong></p>"; ?>
    
    <form method="POST" action="login.php">
        <input type="text" name="username" placeholder="Username" required><br><br>
        <input type="password" name="password" placeholder="Password" required><br><br>
        <button type="submit">Login</button>
    </form>
</body>
</html>
