export function GET() {
    return Response.json({
        info: "EmailThing API v0",
        routes: ["GET  /v0/whoami", "POST /v0/receive-email", "POST /v0/send-email"],
    });
}
