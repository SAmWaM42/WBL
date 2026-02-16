<?php
require_once("load.php");
$disable = true;
$destination = "";
$ouput = "";
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = $_POST["UserName"];
    $pass = $_POST["password"];
    $conf = $_POST["passConfirm"];
    $Conn = $conn->get_connection();

    $error = [];
    $output = "";


    $validate = true;
    if ($name == null || $name == "" || $pass == null || $name == "") {
        $ouput= "values not filled";
        $validate = false;

    }
    try {


        $stmt = "select *from users where username=?";
        $pStmnt = $Conn->prepare($stmt);
        $pStmnt->bind_param('s', $name);
        $pStmnt->execute();
        if ($pStmnt) {
            if ($pStmnt->get_result()->fetch_assoc() != null) {
                $ouput = "username already exists";

                $validate = false;
            }

        }

    } catch (Error $e) {
        echo "error executing script:" . $e;
    }


    if ($validate) {
        $p1 = escapeshellarg($name);
        $p2 = escapeshellarg($pass);
        $command = "python validate.py " . $p2 . " " . $p1;
        try {
            $ouput = trim(shell_exec($command));
        } catch (Error $e) {
            echo "error executing script:" . $e;
        }

    
        if ($ouput === "true") {
            $disable = false;
            if ($pass == $conf) {
                try {
                    $id = "user" . random_int(000000, 999999);

                    $hash = password_hash($pass, PASSWORD_DEFAULT);
                    $stmt = "insert into users(id,username,passHash) values(?,?,?)";
                    $pStmnt = $Conn->prepare($stmt);
                    $pStmnt->bind_param('sss', $id, $name, $hash);
                    $pStmnt->execute();
                    if ($pStmnt) {
                        $ouput = "successful";
                        header("Location:../login.php");

                    }
                } catch (Error $e) {
                    $ouput = "error storing in database:" . $e;
                }
                #to be set to the predictor but first need to send the data 
            }
            else
                {
                    $output="paswords don't match";
                }


        }
    }

}

#execute script here to try and get everything as it should be

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <title>Input Validation</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-gray-100 min-h-screen flex items-center justify-center py-12 px-4">

    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-10 space-y-8">

        <h1 class="text-3xl font-bold text-center text-gray-800">
            Create Account
        </h1>

        <form action="" method="POST" class="space-y-6">

            <!-- Username -->
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">
                    Username
                </label>
                <input 
                    name="UserName" 
                    type="text" 
                    placeholder="Enter username"
                    value="<?php echo $_POST['UserName'] ?? ''; ?>"
                    class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                >
            </div>

            <!-- Password -->
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">
                    Password
                </label>
                <input 
                    name="password" 
                    type="password" 
                    placeholder="Enter password"
                    value="<?php echo $_POST['password'] ?? ''; ?>"
                    class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                >
            </div>

            <!-- Confirm Password -->
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">
                    Confirm Password
                </label>
                <input 
                    name="passConfirm" 
                    type="password" 
                    placeholder="Confirm password"
                    value="<?php echo $_POST['passConfirm'] ?? ''; ?>"
                    class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                >
            </div>

            <!-- Output Message -->
            <?php if (!empty($ouput)): ?>
                <div class="text-center text-sm font-medium text-red-600">
                    <?php echo $ouput; ?>
                </div>
            <?php endif; ?>

            <!-- Buttons -->
            <div class="space-y-4 pt-4">

                <button 
                    type="submit"
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-md"
                >
                    Register
                </button>

                <a 
                    href="login.php"
                    class="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition"
                >
                    Go to Login
                </a>

            </div>

        </form>
    </div>

</body>
