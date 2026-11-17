/** Katrina Jota Real Estate inquiry emails. Deploy separately from the Vite site. */
var INQUIRY_CONFIG = {
  recipient: 'rozelramos17@gmail.com',
  brand: 'Katrina Jota Real Estate',
  dailyLimit: 30,
  maxBodyLength: 14000,
  statuses: ['Looking to buy', 'Looking to sell', 'Both buying and selling'],
  timelines: ['As soon as possible', 'Within 3 months', 'Within 6 months', 'More than 6 months']
};

function doGet() {
  return jsonResponse_({ ok: false, code: 'POST_REQUIRED' });
}

function doPost(e) {
  var lock;
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > INQUIRY_CONFIG.maxBodyLength) {
      return jsonResponse_({ ok: false, code: 'INVALID_REQUEST' });
    }
    var payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return jsonResponse_({ ok: false, code: 'INVALID_REQUEST' });
    }
    var properties = PropertiesService.getScriptProperties();
    var secret = properties.getProperty('INQUIRY_SECRET');
    // The secret belongs in a trusted server/relay, never a VITE_ variable.
    if (!secret || secret.length < 32 || payload.secret !== secret) {
      return jsonResponse_({ ok: false, code: 'UNAUTHORIZED' });
    }
    // Authenticated connection check. Never sends mail or consumes the mail quota.
    if (payload.action === 'check') {
      return jsonResponse_({ ok: true, recipient: INQUIRY_CONFIG.recipient });
    }
    if (payload.website) return jsonResponse_({ ok: false, code: 'INVALID_REQUEST' });
    var inquiry = validateInquiry_(payload);
    if (!inquiry) return jsonResponse_({ ok: false, code: 'VALIDATION_ERROR' });

    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return jsonResponse_({ ok: false, code: 'BUSY' });

    var now = Date.now();
    var fingerprint = Utilities.base64EncodeWebSafe(Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, JSON.stringify(inquiry), Utilities.Charset.UTF_8
    ));
    // Bounded ledger of hashes only: no inquiry text or email addresses stored.
    var ledger = JSON.parse(properties.getProperty('INQUIRY_SENDS') || '[]')
      .filter(function (entry) { return entry.at > now - 86400000; });
    var duplicate = ledger.some(function (entry) { return entry.hash === fingerprint; });
    if (duplicate) return jsonResponse_({ ok: true, duplicate: true });
    if (ledger.length >= INQUIRY_CONFIG.dailyLimit || MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse_({ ok: false, code: 'LIMIT_REACHED' });
    }

    var timestamp = Utilities.formatDate(new Date(now), 'America/Toronto', 'MMMM d, yyyy, h:mm a z');
    var subject = 'New real estate inquiry | ' + inquiry.fullName;
    MailApp.sendEmail({
      to: INQUIRY_CONFIG.recipient,
      name: INQUIRY_CONFIG.brand,
      replyTo: inquiry.email,
      subject: subject,
      body: renderPlainText_(inquiry, timestamp),
      htmlBody: renderInquiryEmail_(inquiry, timestamp, properties.getProperty('LOGO_URL') || '')
    });
    ledger.push({ hash: fingerprint, at: now });
    properties.setProperty('INQUIRY_SENDS', JSON.stringify(ledger));
    // MailApp accepted the send; this is not confirmation of inbox delivery.
    return jsonResponse_({ ok: true });
  } catch (error) {
    // Do not log submitted personal information or the secret.
    return jsonResponse_({ ok: false, code: 'SEND_FAILED' });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

function validateInquiry_(payload) {
  var limits = { fullName: 120, email: 254, phone: 40, status: 80, area: 200, timeline: 80, message: 5000 };
  var values = {};
  for (var key in limits) {
    if (payload[key] !== undefined && typeof payload[key] !== 'string') return null;
    values[key] = (payload[key] || '').trim();
    if (values[key].length > limits[key]) return null;
    if (key !== 'message' && /[\r\n\x00-\x1f\x7f]/.test(values[key])) return null;
    if (key === 'message' && /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(values[key])) return null;
  }
  if (!values.fullName || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(values.email)) return null;
  if (values.status && INQUIRY_CONFIG.statuses.indexOf(values.status) === -1) return null;
  if (values.timeline && INQUIRY_CONFIG.timelines.indexOf(values.timeline) === -1) return null;
  return values;
}

function escapeHtml_(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
  });
}

function renderPlainText_(inquiry, timestamp) {
  return INQUIRY_CONFIG.brand + '\nNEW WEBSITE INQUIRY\nReceived: ' + timestamp + '\n\n' +
    'Full name: ' + inquiry.fullName + '\nEmail: ' + inquiry.email +
    '\nPhone: ' + (inquiry.phone || 'Not provided') +
    '\nBuying/selling status: ' + (inquiry.status || 'Not provided') +
    '\nPreferred area: ' + (inquiry.area || 'Not provided') +
    '\nTimeline: ' + (inquiry.timeline || 'Not provided') +
    '\n\nMessage\n' + (inquiry.message || 'No message provided.') +
    '\n\nReply to this email to contact the visitor.\nToronto, GTA, Canada';
}

function renderInquiryEmail_(inquiry, timestamp, logoUrl) {
  var safe = escapeHtml_;
  var email = safe(inquiry.email);
  var replyUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(inquiry.email) +
    '&su=' + encodeURIComponent('Re: Your real estate inquiry');
  var logo = /^https:\/\/[^\s]+$/i.test(logoUrl)
    ? '<img src="' + safe(logoUrl) + '" alt="Katrina Jota Real Estate" width="240" style="display:block;width:240px;max-width:100%;height:auto;border:0;">'
    : '<p style="margin:0;color:#024D2C;font-size:16px;font-weight:600;">Katrina Jota Real Estate</p>';
  var rows = [
    ['Full name', inquiry.fullName],
    ['Email', '<a href="mailto:' + safe(encodeURIComponent(inquiry.email)) + '" style="color:#024D2C;text-decoration:underline;">' + email + '</a>', true],
    ['Phone', inquiry.phone],
    ['Buying/selling status', inquiry.status],
    ['Preferred area', inquiry.area],
    ['Timeline', inquiry.timeline]
  ].map(function (row) {
    return '<tr><td style="padding:16px 0;border-bottom:1px solid #e3e7df;">' +
      '<p style="margin:0 0 6px;color:#59625b;font-size:14px;line-height:1.5;">' + row[0] + '</p>' +
      '<p style="margin:0;color:#242824;font-size:16px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;">' +
      (row[2] ? row[1] : safe(row[1] || 'Not provided')) + '</p></td></tr>';
  }).join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>New real estate inquiry</title></head>' +
    '<body style="margin:0;padding:0;background:#FAFBF7;color:#242824;">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A new inquiry from ' + safe(inquiry.fullName) + '.</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFBF7;font-family:\'DM Sans\',Arial,sans-serif;">' +
    '<tr><td align="center" style="padding:32px 12px;">' +
    '<!--[if mso]><table role="presentation" width="640"><tr><td><![endif]-->' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;">' +
    '<tr><td style="padding:32px 24px;background:#FAFBF7;border-top:3px solid #BF9C61;">' + logo + '</td></tr>' +
    '<tr><td style="padding:36px 24px;background:#024D2C;color:#FFFFFF;">' +
    '<p style="margin:0 0 14px;font-size:13px;line-height:1.5;letter-spacing:2px;font-weight:600;">NEW WEBSITE INQUIRY</p>' +
    '<h1 style="margin:0;color:#FFFFFF;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:36px;font-weight:600;line-height:1.15;">A new conversation<br>starts here.</h1>' +
    '<p style="margin:20px 0 0;color:#FFFFFF;font-size:16px;line-height:1.7;">' + safe(inquiry.fullName) + ' has contacted you through your website.</p></td></tr>' +
    '<tr><td style="padding:32px 24px;">' +
    '<p style="margin:0 0 24px;color:#59625b;font-size:13px;line-height:1.6;">RECEIVED &nbsp; ' + safe(timestamp) + '</p>' +
    '<h2 style="margin:0 0 8px;color:#024D2C;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:32px;line-height:1.2;font-weight:600;">Inquiry details</h2>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;">' + rows + '</table>' +
    '<h2 style="margin:32px 0 16px;color:#024D2C;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:32px;line-height:1.2;font-weight:600;">Message</h2>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed;"><tr><td style="padding:20px;background:#FAFBF7;border-left:2px solid #BF9C61;">' +
    '<p style="margin:0;font-size:16px;line-height:1.8;overflow-wrap:anywhere;word-break:break-word;">' + safe(inquiry.message || 'No message provided.').replace(/\r?\n/g, '<br>') + '</p></td></tr></table>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td bgcolor="#024D2C" style="background:#024D2C;">' +
    '<a target="_blank" href="' + safe(replyUrl) + '" style="display:inline-block;padding:17px 24px;border:1px solid #024D2C;color:#FFFFFF;font-size:16px;font-weight:600;line-height:1.5;text-decoration:none;">Reply to inquiry &rarr;</a></td></tr></table>' +
    '<p style="margin:16px 0 0;color:#59625b;font-size:14px;line-height:1.7;">You can also reply directly to this email to reach the visitor.</p></td></tr>' +
    '<tr><td style="padding:24px;background:#FAFBF7;border-top:1px solid #BF9C61;">' +
    '<p style="margin:0;color:#024D2C;font-size:16px;font-weight:600;line-height:1.6;">Katrina Jota Real Estate</p>' +
    '<p style="margin:6px 0 0;color:#59625b;font-size:14px;line-height:1.7;">Toronto, GTA, Canada<br>' +
    '<a href="tel:+14168875670" style="color:#024D2C;text-decoration:underline;">(416) 887-5670</a></p>' +
    '<p style="margin:20px 0 0;color:#59625b;font-size:12px;line-height:1.7;">This email contains contact information submitted through your website. Please handle it with care.</p>' +
    '</td></tr></table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>';
}

function jsonResponse_(result) {
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

/** Run manually once in the Apps Script editor to authorize MailApp. Sends nothing. */
function authorizeMail() {
  return MailApp.getRemainingDailyQuota();
}
