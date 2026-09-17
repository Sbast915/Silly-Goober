# chat-api

Runs on the Oracle VM (141.148.243.201) alongside coturn.

- No npm dependencies: node builtins only.
- Storage: append-only JSONL at /var/silly-goober-media/messages.jsonl
- Media: /var/silly-goober-media/<32hex>.<ext>
- HTTPS on :4000 with a self-signed cert; the public cert is committed as
  `chat-cert.pem` so Render can pin it. The private key stays on the VM.
- Every request needs `Authorization: Bearer $CHAT_API_SECRET`.

Only Render talks to this. The browser goes through Render, which checks
the user's session token first.

Deploy: /opt/silly-goober-chat/server.js, systemd unit `silly-goober-chat`,
env in /etc/silly-goober/chat.env
