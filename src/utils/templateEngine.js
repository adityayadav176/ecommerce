export const emailTemplates = (type, data) => {
    switch (type) {

        case "REGISTER":
            return {
                subject: "Welcome To Our App 🎉",
                html: `
                    <div>
                        <h2>Welcome 🎉</h2>
                        <p>Hi <b>${data.name}</b>,</p>
                        <p>Your account has been created successfully.</p>
                    </div>
                `
            };

        case "LOGIN_ALERT":
            return {
                subject: "New Login Detected 🔐",
                html: `
                    <div>
                        <h2>Security Alert 🔐</h2>
                        <p>We detected a new login.</p>
                        <p><b>IP:</b> ${data.ip}</p>
                        <p>If this wasn't you, please secure your account.</p>
                    </div>
                `
            };

        default:
            throw new Error("Unknown email type: " + type);
    }
};