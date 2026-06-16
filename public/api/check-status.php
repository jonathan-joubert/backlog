<?php
/**
 * Backlog SAPS status proxy.
 * Mirrors the Node express server in server/saps-proxy.ts so the frontend
 * can call /api/check-status in both dev and production without changes.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$SAPS_URL = 'https://www.saps.gov.za/services/firearm_status_enquiry.php';
$UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    $input = $_POST;
}

$fsref = isset($input['fsref']) ? trim((string) $input['fsref']) : '';
$fserial = isset($input['fserial']) ? trim((string) $input['fserial']) : '';

if ($fsref === '' || $fserial === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Reference and Serial numbers are required']);
    exit;
}

$cookieFile = tempnam(sys_get_temp_dir(), 'saps_');

function curl_base($url, $cookieFile, $UA) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT      => $UA,
        CURLOPT_COOKIEJAR      => $cookieFile,
        CURLOPT_COOKIEFILE     => $cookieFile,
        CURLOPT_TIMEOUT        => 25,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER     => [
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.5',
        ],
    ]);
    return $ch;
}

try {
    // Step 1: GET to initialise session & grab CSRF.
    $ch = curl_base($SAPS_URL, $cookieFile, $UA);
    curl_setopt($ch, CURLOPT_HEADER, true);
    $response = curl_exec($ch);
    if ($response === false) {
        throw new Exception(curl_error($ch) ?: 'Failed to reach SAPS server');
    }
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $headerSize);
    $body = substr($response, $headerSize);
    curl_close($ch);

    $csrf = '';
    if (preg_match_all('/^Set-Cookie:\s*csrf_token=([^;\r\n]+)/mi', $headers, $m)) {
        $csrf = end($m[1]);
    }
    if ($csrf === '' && preg_match('/name="csrf_token"\s+value="([^"]+)"/i', $body, $m)) {
        $csrf = $m[1];
    }

    // Step 2: POST the form.
    $postData = http_build_query([
        'csrf_token' => $csrf,
        'fsref'      => $fsref,
        'fserial'    => $fserial,
    ]);

    $ch = curl_base($SAPS_URL . '#result', $cookieFile, $UA);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt(
        $ch,
        CURLOPT_HTTPHEADER,
        [
            'Content-Type: application/x-www-form-urlencoded',
            'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language: en-US,en;q=0.5',
            'Referer: ' . $SAPS_URL,
        ]
    );
    $html = curl_exec($ch);
    if ($html === false) {
        throw new Exception(curl_error($ch) ?: 'Failed to communicate with SAPS server');
    }
    curl_close($ch);
} catch (Exception $e) {
    @unlink($cookieFile);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to communicate with SAPS server.']);
    exit;
}

@unlink($cookieFile);

// Step 3: Parse table.table-bordered tbody tr.active td (mirrors cheerio query).
libxml_use_internal_errors(true);
$doc = new DOMDocument();
$doc->loadHTML('<?xml encoding="UTF-8"?>' . $html);
$xpath = new DOMXPath($doc);
$nodes = $xpath->query(
    "//table[contains(concat(' ', normalize-space(@class), ' '), ' table-bordered ')]"
    . "//tbody//tr[contains(concat(' ', normalize-space(@class), ' '), ' active ')]/td"
);

if (!$nodes || $nodes->length === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'No status found. Please check your Reference and Serial numbers.']);
    exit;
}

$cells = [];
foreach ($nodes as $n) {
    $cells[] = trim(preg_replace('/\s+/u', ' ', $n->textContent));
}

echo json_encode([
    'applicationType'    => $cells[0] ?? '',
    'applicationNumber'  => $cells[1] ?? '',
    'calibre'            => $cells[2] ?? '',
    'make'               => $cells[3] ?? '',
    'serialNumber'       => $cells[4] ?? '',
    'statusDate'         => $cells[5] ?? '',
    'status'             => $cells[6] ?? '',
    'statusDescription'  => $cells[7] ?? '',
    'nextStep'           => $cells[8] ?? '',
]);
