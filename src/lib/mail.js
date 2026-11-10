// E-mails sent by the site through the Resend API (server only, called from server functions).
// Settings, read at run time: RESEND_API_KEY, MAIL_FROM, MAIL_NOTIFY_TO (see .env.example).
import { CONTACT } from "@/data/site";
import { DOWNLOAD_DAYS, DOWNLOAD_LIMIT, formatPrice } from "@/lib/boutique";

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

// --- Shop (ORDRE n° 18) ---

const orderLines = (commande) =>
  commande.lignes.map((ligne) => [ligne.title, formatPrice(ligne.price_cents)]).concat([["Total", formatPrice(commande.total_cents)]]);

// A new order: notify the agency, and tell the buyer what happens next (payment, then the link).
// Never throws: the order is already saved, a mail failure is only logged.
export async function sendCommandeEmails(commande) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY absente : e-mails de la commande non envoyés.");
    return;
  }
  const agency = process.env.MAIL_NOTIFY_TO || CONTACT.email;
  const lines = orderLines(commande);
  const buyer = [
    ["Référence", commande.reference],
    ["Nom", commande.nom],
    ["E-mail", commande.email],
    ["Téléphone", commande.telephone],
  ];

  const notification = sendEmail({
    to: agency,
    replyTo: commande.email,
    subject: `Nouvelle commande ${commande.reference} : ${formatPrice(commande.total_cents)}`,
    html: layout(
      `Nouvelle commande ${escapeHtml(commande.reference)}`,
      `<p style="margin:0 0 18px;font-size:15px;line-height:1.6">Contactez ${escapeHtml(commande.nom)} pour le paiement, puis marquez la commande « payée » dans Administration › Commandes : le lien de téléchargement part tout seul.</p>${rows(buyer)}<p style="margin:22px 0 10px;font-size:15px">Livres commandés :</p>${rows(lines)}`,
    ),
    text: `Nouvelle commande ${commande.reference}\n\n${asText(buyer)}\n\nLivres commandés :\n${asText(lines)}`,
  });

  const acknowledgement = sendEmail({
    to: commande.email,
    replyTo: agency,
    subject: `Votre commande ${commande.reference} · SYSI TRAVEL`,
    html: layout(
      `Merci ${escapeHtml(commande.nom)}, votre commande est bien reçue`,
      `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Nous vous contactons sous <strong>72 heures</strong> pour le paiement. Dès qu'il est reçu, vous recevez par e-mail votre lien de téléchargement.</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6">Référence : <strong>${escapeHtml(commande.reference)}</strong></p>${rows(lines)}
<p style="margin:22px 0 0;font-size:15px;line-height:1.6">Une question ? Répondez simplement à cet e-mail, ou écrivez-nous sur WhatsApp au ${escapeHtml(CONTACT.phone)}.</p>`,
    ),
    text: `Bonjour ${commande.nom},\n\nNous avons bien reçu votre commande ${commande.reference}. Nous vous contactons sous 72 heures pour le paiement ; dès qu'il est reçu, vous recevez par e-mail votre lien de téléchargement.\n\n${asText(lines)}\n\nUne question ? Répondez à cet e-mail, ou écrivez-nous sur WhatsApp au ${CONTACT.phone}.\n\nSYSI TRAVEL`,
  });

  const results = await Promise.allSettled([notification, acknowledgement]);
  for (const result of results) {
    if (result.status === "rejected") console.error("E-mail de commande non envoyé :", result.reason);
  }
}

// The paid order's download link. Returns false when the e-mail could not be sent, so the
// administration can say so (the admin can still copy the link and send it on WhatsApp).
export async function sendLienTelechargement(commande, url) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY absente : lien de téléchargement non envoyé.");
    return false;
  }
  const titles = commande.lignes.map((ligne) => `<li style="margin:0 0 6px">${escapeHtml(ligne.title)}</li>`).join("");
  try {
    await sendEmail({
      to: commande.email,
      replyTo: process.env.MAIL_NOTIFY_TO || CONTACT.email,
      subject: `Vos livres sont prêts · commande ${commande.reference}`,
      html: layout(
        "Vos livres sont prêts à télécharger",
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6">Merci ${escapeHtml(commande.nom)}, votre paiement est bien reçu. Vos livres :</p>
<ul style="margin:0 0 22px;padding-left:20px;font-size:15px;line-height:1.5">${titles}</ul>
<p style="margin:0 0 24px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#E6B45C;color:#0B2A2E;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:999px">Télécharger mes livres</a></p>
<p style="margin:0;font-size:13px;line-height:1.6;color:#5E6B6A">Ce lien personnel est valable ${DOWNLOAD_DAYS} jours (${DOWNLOAD_LIMIT} téléchargements au plus). Gardez-le pour vous : il donne accès à vos fichiers. Les PDF se lisent sur téléphone, tablette et ordinateur.</p>`,
      ),
      text: `Bonjour ${commande.nom},\n\nVotre paiement est bien reçu. Téléchargez vos livres ici :\n${url}\n\nCe lien personnel est valable ${DOWNLOAD_DAYS} jours (${DOWNLOAD_LIMIT} téléchargements au plus). Gardez-le pour vous.\n\nSYSI TRAVEL`,
    });
    return true;
  } catch (error) {
    console.error("Lien de téléchargement non envoyé :", error);
    return false;
  }
}
