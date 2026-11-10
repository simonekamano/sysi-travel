// E-mails sent by the site through the Resend API (server only, called from server functions).
// Settings, read at run time: RESEND_API_KEY, MAIL_FROM, MAIL_NOTIFY_TO (see .env.example).
import { CONTACT } from "@/data/site";

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

async function sendEmail({ to, subject, html, text, replyTo }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "SYSI TRAVEL <no-reply@sysitravel.com>",
      to: [to],
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status} : ${await response.text()}`);
}

// Brand-coloured frame shared by both messages (inline styles: mail clients ignore stylesheets).
const layout = (title, body) => `<!doctype html>
<html lang="fr"><body style="margin:0;background:#F7F5F0;font-family:Arial,Helvetica,sans-serif;color:#1C2B2D">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F0;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E3DED3">
<tr><td style="background:#123D43;padding:22px 28px;color:#E6B45C;font-size:13px;font-weight:bold;letter-spacing:3px">SYSI TRAVEL · GUINÉE</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#123D43">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #E3DED3;font-size:12px;color:#5E6B6A">
SYSI TRAVEL · ${escapeHtml(CONTACT.address)} · WhatsApp ${escapeHtml(CONTACT.phone)}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

const rows = (fields) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">${fields
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid #E3DED3;color:#5E6B6A;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #E3DED3">${escapeHtml(value || "—").replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("")}</table>`;

const asText = (fields) => fields.map(([label, value]) => `${label} : ${value || "—"}`).join("\n");

// A new travel request: notify the agency, and acknowledge receipt to the traveller.
// Never throws: the request is already saved, a mail failure is only logged.
export async function sendDemandeEmails(demande) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY absente : e-mails de la demande non envoyés.");
    return;
  }
  const agency = process.env.MAIL_NOTIFY_TO || CONTACT.email;

  const trip = [
    ["Destination", demande.destination || "À définir"],
    ["Formule", demande.formule || "À définir ensemble"],
    ["Période", demande.periode],
    ["Voyageurs", demande.voyageurs],
    ...(demande.transfert
      ? [
          ["Prise en charge aéroport", "Oui"],
          ["Arrivée", demande.arrivee],
          ["Lieu de séjour", demande.hebergement],
        ]
      : []),
  ];
  const details = [
    ["Nom", demande.nom],
    ["E-mail", demande.email],
    ["Téléphone", demande.telephone],
    ["Pays de résidence", demande.pays],
    ...trip,
    ["Message", demande.message],
  ];

  const notification = sendEmail({
    to: agency,
    replyTo: demande.email,
    subject: `Nouvelle demande de séjour : ${demande.nom}`,
    html: layout(
      "Nouvelle demande de séjour",
      `<p style="margin:0 0 18px;font-size:15px;line-height:1.6">Répondez directement à cet e-mail pour écrire à ${escapeHtml(demande.nom)}. La demande est aussi dans l'administration du site.</p>${rows(details)}`,
    ),
    text: `Nouvelle demande de séjour\n\n${asText(details)}`,
  });

  // The acknowledgement repeats only the trip choices, never the free message.
  const acknowledgement = sendEmail({
    to: demande.email,
    replyTo: agency,
    subject: "Nous avons bien reçu votre demande · SYSI TRAVEL",
    html: layout(
      `Merci ${escapeHtml(demande.nom)}, votre demande est bien reçue`,
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Un expert SYSI TRAVEL vous répond sous <strong>72 heures</strong> avec un premier itinéraire et une estimation de budget claire.</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6">Votre projet :</p>${rows(trip)}
<p style="margin:22px 0 0;font-size:15px;line-height:1.6">Une question d'ici là ? Répondez simplement à cet e-mail, ou écrivez-nous sur WhatsApp au ${escapeHtml(CONTACT.phone)}.</p>`,
    ),
    text: `Bonjour ${demande.nom},\n\nNous avons bien reçu votre demande. Un expert SYSI TRAVEL vous répond sous 72 heures avec un premier itinéraire et une estimation de budget claire.\n\nVotre projet :\n${asText(trip)}\n\nUne question d'ici là ? Répondez à cet e-mail, ou écrivez-nous sur WhatsApp au ${CONTACT.phone}.\n\nSYSI TRAVEL`,
  });

  const results = await Promise.allSettled([notification, acknowledgement]);
  for (const result of results) {
    if (result.status === "rejected") console.error("E-mail de demande non envoyé :", result.reason);
  }
}
