# Tactics AI Gateway

Cloudflare Worker — API Gateway للمشروع.

## الوظيفة
- Proxy آمن إلى Groq API (Chat)
- Proxy إلى Backend (Video Analysis — لاحقًا)

## الروابط
| Endpoint | الوصف |
|---|---|
| `GET /health` | فحص الحالة |
| `POST /api/chat` | Proxy إلى Groq |
| `GET/POST /api/v1/analyze/*` | Proxy إلى Backend (لاحقًا) |

## الأمان
- API Keys في Cloudflare Secrets
- CORS allowlist
