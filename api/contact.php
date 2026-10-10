<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, bool $ok, string $message): never
{
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function clean_field(string $key, int $maxLength): string
{
    $value = trim((string)($_POST[$key] ?? ''));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    return mb_substr($value, 0, $maxLength);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Method not allowed');
}

// Honeypot: bots commonly fill fields hidden from real visitors.
if (clean_field('website', 200) !== '') {
    respond(200, true, 'Thank you. Your enquiry has been sent');
}

$started = filter_input(INPUT_POST, 'form_started', FILTER_VALIDATE_INT);
if (!$started || ((int)(microtime(true) * 1000) - $started) < 1500) {
    respond(400, false, 'Please wait a moment and try again');
}

$name = clean_field('name', 100);
$company = clean_field('company', 150);
$email = clean_field('email', 254);
$phone = clean_field('phone', 30);
$message = clean_field('message', 2000);

if ($name === '' || $company === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'Please complete all required fields correctly');
}

$configPath = getenv('VELLCREST_CONFIG_PATH');
if (!$configPath) {
    // Support both a primary-domain document root and a subdomain stored
    // beneath another site's public_html, while keeping secrets outside every
    // publicly served directory.
    $configPath = '';
    for ($levels = 2; $levels <= 5; $levels++) {
        $candidate = dirname(__DIR__, $levels) . DIRECTORY_SEPARATOR . 'vellcrest-private' . DIRECTORY_SEPARATOR . 'config.php';
        if (is_file($candidate)) {
            $configPath = $candidate;
            break;
        }
    }
}
if (!is_file($configPath)) {
    error_log('Vellcrest contact form: private configuration file not found');
    respond(500, false, 'The enquiry service is temporarily unavailable');
}

$config = require $configPath;
$requiredKeys = ['tenant_id', 'client_id', 'client_secret', 'sender', 'recipient', 'subject'];
foreach ($requiredKeys as $key) {
    if (!isset($config[$key]) || trim((string)$config[$key]) === '') {
        error_log("Vellcrest contact form: missing configuration value {$key}");
        respond(500, false, 'The enquiry service is temporarily unavailable');
    }
}

$tokenRequest = curl_init('https://login.microsoftonline.com/' . rawurlencode($config['tenant_id']) . '/oauth2/v2.0/token');
curl_setopt_array($tokenRequest, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
    CURLOPT_POSTFIELDS => http_build_query([
        'client_id' => $config['client_id'],
        'client_secret' => $config['client_secret'],
        'scope' => 'https://graph.microsoft.com/.default',
        'grant_type' => 'client_credentials',
    ]),
]);
$tokenBody = curl_exec($tokenRequest);
$tokenStatus = (int)curl_getinfo($tokenRequest, CURLINFO_RESPONSE_CODE);
$tokenError = curl_error($tokenRequest);
curl_close($tokenRequest);

$tokenData = json_decode((string)$tokenBody, true);
if ($tokenStatus !== 200 || !is_array($tokenData) || empty($tokenData['access_token'])) {
    error_log('Vellcrest contact form token failure: HTTP ' . $tokenStatus . ' ' . $tokenError);
    respond(502, false, 'The enquiry service is temporarily unavailable');
}

$escape = static fn(string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$receivedAt = (new DateTimeImmutable('now', new DateTimeZone('Asia/Kolkata')))->format('d M Y, h:i A T');
$html = '<div style="font-family:Arial,sans-serif;color:#151a4f;line-height:1.55">'
    . '<h2 style="color:#20287a">Website enquiry</h2>'
    . '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:680px">'
    . '<tr><td style="font-weight:bold;width:150px;border-bottom:1px solid #ddd">Name</td><td style="border-bottom:1px solid #ddd">' . $escape($name) . '</td></tr>'
    . '<tr><td style="font-weight:bold;border-bottom:1px solid #ddd">Company</td><td style="border-bottom:1px solid #ddd">' . $escape($company) . '</td></tr>'
    . '<tr><td style="font-weight:bold;border-bottom:1px solid #ddd">Email</td><td style="border-bottom:1px solid #ddd">' . $escape($email) . '</td></tr>'
    . '<tr><td style="font-weight:bold;border-bottom:1px solid #ddd">Phone</td><td style="border-bottom:1px solid #ddd">' . $escape($phone ?: 'Not provided') . '</td></tr>'
    . '<tr><td style="font-weight:bold;border-bottom:1px solid #ddd;vertical-align:top">Message</td><td style="border-bottom:1px solid #ddd">' . nl2br($escape($message)) . '</td></tr>'
    . '<tr><td style="font-weight:bold">Received</td><td>' . $escape($receivedAt) . '</td></tr>'
    . '</table></div>';

$mail = [
    'message' => [
        'subject' => $config['subject'],
        'body' => ['contentType' => 'HTML', 'content' => $html],
        'toRecipients' => [[
            'emailAddress' => ['address' => $config['recipient']],
        ]],
        'replyTo' => [[
            'emailAddress' => ['address' => $email, 'name' => $name],
        ]],
    ],
    'saveToSentItems' => false,
];

$sendRequest = curl_init('https://graph.microsoft.com/v1.0/users/' . rawurlencode($config['sender']) . '/sendMail');
curl_setopt_array($sendRequest, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $tokenData['access_token'],
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($mail, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
]);
$sendBody = curl_exec($sendRequest);
$sendStatus = (int)curl_getinfo($sendRequest, CURLINFO_RESPONSE_CODE);
$sendError = curl_error($sendRequest);
curl_close($sendRequest);

if ($sendStatus !== 202) {
    error_log('Vellcrest contact form send failure: HTTP ' . $sendStatus . ' ' . $sendError . ' ' . substr((string)$sendBody, 0, 500));
    respond(502, false, 'Your enquiry could not be sent. Please try again');
}

respond(200, true, 'Thank you. Your enquiry has been sent');
