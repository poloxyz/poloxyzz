module.exports = async (req, res) => {
    // Cập nhật tên biến môi trường theo yêu cầu
    const token = process.env.bot;    // Thay cho BOT_TOKEN
    const chatPhoto = process.env.yid; // Thay cho WITH_PHOTO
    const chatText = process.env.nid;  // Thay cho NO_PHOTO

    // Kiểm tra xem các biến môi trường mới đã được cài đặt chưa
    if (!token || !chatPhoto || !chatText) {
        return res.status(500).json({ error: "Thieu bien moi truong (bot, yid, nid)" });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { type, media, text } = req.body;

        // Xử lý gửi tin nhắn văn bản (khi không chụp được ảnh)
        if (type === 'text') {
            const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatText, text }) // Sử dụng biến nid (chatText)
            });
            return res.status(200).json(await r.json());
        }

        // Xử lý gửi Media Group (khi có ảnh)
        if (type === 'media' && Array.isArray(media)) {
            const formData = new FormData();
            formData.append('chat_id', chatPhoto); // Sử dụng biến yid (chatPhoto)

            const telegramMediaArray = media.map((item, index) => {
                const fileKey = `photo${index}`;
                
                // Chuyển Base64 thành File Blob
                const base64Data = item.media.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const blob = new Blob([buffer], { type: 'image/jpeg' });

                formData.append(fileKey, blob, `image${index}.jpg`);

                return {
                    type: 'photo',
                    media: `attach://${fileKey}`,
                    caption: item.caption || ''
                };
            });

            formData.append('media', JSON.stringify(telegramMediaArray));

            const r = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
                method: 'POST',
                body: formData
            });
            return res.status(200).json(await r.json());
        }

        return res.status(400).json({ error: "Data loi" });

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
