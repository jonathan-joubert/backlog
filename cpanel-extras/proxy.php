<?php
// Minimal forwarding proxy for the SAPS firearm status page.
// Upload next to the app on cPanel and set VITE_SAPS_PROXY_URL to its URL.
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-proxy-cookie');
header('Access-Control-Expose-Headers: x-proxy-set-cookie');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$url = $_GET['url'] ?? '';
if (strpos($url, 'https://www.saps.gov.za/') !== 0) { http_response_code(400); exit('Bad URL'); }

$ch = curl_init($url);
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_FOLLOWLOCATION => true,
  // SAPS sends an incomplete certificate chain; skip verification for this one host.
  CURLOPT_SSL_VERIFYPEER => false,
  CURLOPT_SSL_VERIFYHOST => false,
  CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  CURLOPT_HEADERFUNCTION => function ($ch, $header) {
    if (stripos($header, 'set-cookie:') === 0) {
      $cookies[] = trim(substr($header, 11));
      header('x-proxy-set-cookie: ' . implode(',', $cookies ?? []), false);
    }
    return strlen($header);
  },
]);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded',
    !empty($_SERVER['HTTP_X_PROXY_COOKIE']) ? 'Cookie: ' . $_SERVER['HTTP_X_PROXY_COOKIE'] : 'X-None: 1',
  ]);
}
$body = curl_exec($ch);
if ($body === false) { http_response_code(502); exit(curl_error($ch)); }
http_response_code(curl_getinfo($ch, CURLINFO_RESPONSE_CODE));
header('Content-Type: text/html; charset=utf-8');
echo $body;
