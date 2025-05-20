const { RtcTokenBuilder, RtcRole, RtmTokenBuilder, RtmRole } = require('agora-access-token');

// 🔐 These must match exactly with your Agora project credentials from https://console.agora.io
const APP_ID = 'c773f07a38144d1899afcd28886f385a';
const APP_CERTIFICATE = 'f494b2a4f7aa4156ade00608ce686b7a';

// 📞 RTC Token Generator (for Audio/Video call)
exports.generateRtcToken = (req, res, next) => {
    try {
        const channelName = req.query.channel;
        const uid = req.query.uid || 0; // Can be number (recommended for RTC)
        const role = RtcRole.PUBLISHER;
        const expireTimeInSeconds = 3600;

        if (!channelName) {
            return res.status(400).json({ error: 'Channel name is required' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTimestamp + expireTimeInSeconds;

        // ✅ Use buildTokenWithUid for numeric uid (e.g., 0, 123)
        const token = RtcTokenBuilder.buildTokenWithUid(
            APP_ID,
            APP_CERTIFICATE,
            channelName,
            Number(uid),
            role,
            privilegeExpireTime
        );

        console.log('[RTC Token]', { channelName, uid, token });

        return res.json({ token });
    } catch (error) {
        next(error);
    }
};

// 💬 RTM Token Generator (for Chat)
exports.generateRtmToken = (req, res, next) => {
    try {
        const userId = req.query.uid; // RTM requires string user ID
        const role = RtmRole.Rtm_User;
        const expireTimeInSeconds = 3600;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required for RTM token' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTimestamp + expireTimeInSeconds;

        // ✅ Use buildToken for RTM with string userId
        const token = RtmTokenBuilder.buildToken(
            APP_ID,
            APP_CERTIFICATE,
            userId,
            role,
            privilegeExpireTime
        );

        console.log('[RTM Token]', { userId, token });

        return res.json({ token });
    } catch (error) {
        next(error);
    }
};
