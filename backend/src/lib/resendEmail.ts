import { Resend } from 'resend';
import { brandName, fromEmail } from '../config/config.ts';

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(
    to: string,
    from: string,
    subject: string,
    html: string
) {
    // Ensure 'from' header includes brand name display: e.g. "Go Better <noreply@mail.gobetter.dev>"
    let sender = from || fromEmail;
    if (!sender.includes('<') && !sender.includes('>')) {
        sender = `${brandName} <${sender}>`;
    }

    const { data, error } = await resend.emails.send({
        from: sender,
        to,
        subject,
        html
    });

    if (error) {
        console.error('Resend email error:', error);
        return false;
    } else {
        return true;
    }
}

export default sendEmail;