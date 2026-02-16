<?php
require_once("load.php");
$output = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = $_POST["UserName"];
    $pass = $_POST["password"];


    $validate = true;
    if ($name == null || $name == "" || $pass == null || $name == "") {
        array_push($error, "values not filled");
        $validate = false;

    }

    if ($validate) {
        $Conn = $conn->get_connection();
        try {
            $stmt = "select *from users where username=?";
            $pStmnt = $Conn->prepare($stmt);
            $pStmnt->bind_param('s', $name);
            $pStmnt->execute();

        } catch (Error $e) {
            $ouput = "System Error:Try again later" . $e;
            echo $ouput;

        }
        $user=$pStmnt->get_result()->fetch_assoc();
        if ($pStmnt == null || sizeof($user)==0) {
            $ouput = "user doesnt exists";


        } else {
           

            $hash = password_verify($pass, $user["passHash"]);
            if (!$hash) {
                $ouput = "Incorrect credentials";

            } else {
                header("Location:http://127.0.0.1:5001/");
                die();
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

<body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">

    <div class="w-full max-w-sm">
        <h1 class="text-2xl font-bold mb-6 text-center text-gray-800">Validation</h1>

        <form action="" method="POST" class="bg-white p-8 rounded-xl shadow-lg">
            <div class="mb-5">
                <label class="block text-sm font-semibold text-gray-600 mb-1">
                    UserName
                </label>
                <input name="UserName" type="text" placeholder="UserName"
                    class="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400">
            </div>
            <div class="mb-5">
                <label class="block text-sm font-semibold text-gray-600 mb-1">
                    Password
                </label>
                <input name="password" type="text" placeholder="password"
                    class="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400">
            </div>

            <?php if (!empty($ouput)): ?>
                <div class="text-center text-sm font-medium text-red-600">
                    <?php echo $ouput; ?>
                </div>
            <?php endif; ?>

            <div class="space-y-4 pt-4">

                <button type='submit'
                    class='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-md'>
                    Submit
                </button>
            </div>

        </form>
    </div>

</body>

</html>