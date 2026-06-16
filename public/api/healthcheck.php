<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$ch = curl_init('https://www.saps.gov.za/services/firearm_status_enquiry.php');
curl_setopt_array($ch, [
    CURLOPT_NOBODY         => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT      => 'Mozilla/5.0 (compatible; Backlog/1.0)',
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_CONNECTTIMEOUT => 5,
]);
curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode(['isUp' => $code === 200]);
