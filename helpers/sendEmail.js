const sgMail = require('@sendgrid/mail');

const sendOtp = function (to, otp) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to,
        from: 'investigobv@gmail.com',
        subject: 'Reset Password',
        html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #eee">
                    <a href="" style="font-size:1.4em;color: #5927e3;text-decoration:none;font-weight:600">Investigo</a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Use the following OTP to reset your password. OTP is valid for 5 minutes.</p>
                <h2 style="background: #5927e3;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                <p style="font-size:0.9em;">Regards,<br />Investigo</p>
                <hr style="border:none;border-top:1px solid #eee" />
                <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                    <p>Investigo</p>
                    <p>Rue aux laines 68-72,</p>
                    <p>1000 Bruxelles,</p>
                    <p>Belgium</p>
                </div>
                </div>
            </div>`,
    };
    sgMail
        .send(msg)
        .catch(error => console.error(error));
};

const sendRecoveryCode = function (to, recoveryCode) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to,
        from: 'investigobv@gmail.com',
        subject: 'Two factor authentication',
        html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #eee">
                    <a href="" style="font-size:1.4em;color: #5927e3;text-decoration:none;font-weight:600">Investigo</a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Two factor authentication is enabled.</p>
                <p>If you loose your device with authentication app, use this backup code to recover your account. Save them in safe place.</p>
                <h2 style="background: #5927e3;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${recoveryCode}</h2>
                <p style="font-size:0.9em;">Regards,<br />Investigo</p>
                <hr style="border:none;border-top:1px solid #eee" />
                <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                    <p>Investigo</p>
                    <p>Rue aux laines 68-72,</p>
                    <p>1000 Bruxelles,</p>
                    <p>Belgium</p>
                </div>
                </div>
            </div>`,
    };
    sgMail
        .send(msg)
        .catch(error => console.error(error));
};

const sendError = function (error) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: 'nik.theappideas@gmail.com',
        from: 'investigobv@gmail.com',
        subject: 'Error message',
        html: `<div>${error}</div>`,
    };
    sgMail
        .send(msg)
        .catch(error => console.error(error));
};

module.exports = {
    sendOtp,
    sendRecoveryCode,
    sendError
};
