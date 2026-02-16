<?php


function classAutoLoad($classname)
{
 
$directories=["INC"];
foreach($directories as $dir)
{
    $filename=dirname(__FILE__).DIRECTORY_SEPARATOR.$dir.DIRECTORY_SEPARATOR.$classname.".php";

    if(file_exists($filename) and is_readable("form.php"))
    {
    
       require_once $filename;
    }
}
}
spl_autoload_register('classAutoLoad');
include "INC/const.php";
$conn=new connections();
$conn->connection(HOSTNAME,HOST,HOSTPASS,"verify");