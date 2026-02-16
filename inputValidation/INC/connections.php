<?php
class connections
{
    private $conn;
    private $pdo_conn;
    public function connection($host, $name, $password, $database)
    {

        $this->conn = mysqli_connect($host, $name, $password, $database);
        if (!$this->conn) {
            echo "failed connection";
        }
    }
    public function pdo_connection( $db_host, $db_port, $db_user, $db_pass, $db_name)
    {

        if ($db_port <> Null) {
            $db_host .= ":" . $db_port;
        }
        try {
            $this->pdo_conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
            // set the PDO error mode to exception
            $this->pdo_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
           // echo "Connected successfully";
        } catch (PDOException $e) {
            echo "Connection failed: " . $e->getMessage();
        }



    }
    public function get_connection()
    {
        return $this->conn;
    }
    public function get_pdo_connection()
    {
        return $this->pdo_conn;
    }
    public function insert_data($statement, $values, $special)
    {
        if (!$special) {
            $exec = $this->conn->prepare($statement);


            $exec->bind_param('iss', $values[0], $values[1], $values[2]);
            $exec->execute();
        } else {
            $exec = $this->conn->prepare($statement);


            $exec->bind_param('isss', $values[0], $values[1], $values[2], $values[3]);
            $exec->execute();
        }


    }
    public function remove_row($id)
    {

    }
    public function update_column($id, $statement)
    {

    }
    
}