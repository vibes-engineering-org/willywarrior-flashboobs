import { PROJECT_TITLE } from "~/lib/constants";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_URL ||
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjg2OTk5OSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDc2ZDUwQjBFMTQ3OWE5QmEyYkQ5MzVGMUU5YTI3QzBjNjQ5QzhDMTIifQ",
      payload:
        "eyJkb21haW4iOiJ3aWxseXdhcnJpb3ItZmxhc2hib29icy52ZXJjZWwuYXBwIn0",
      signature:
        "MHgyYzRmMWViYmI5MTNjNTg4YTM1NjdjNjc0MDEzMjJjMTYyZWVhMTI0MmFmMjgyM2Q3YmI5NDAwMzI3Y2NiNzBkNzllNGU4Y2FiMjMwYjE3ZDQ3MTIzZDZjNTdkYjU1ZWFmMjlmZWY0MTBlNWQ0ODg0MTA3NmQxY2FmMmU1YjkwNDFi",
    },
    miniapp: {
      version: "1",
      name: PROJECT_TITLE,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/frames/hello/opengraph-image`,
      ogImageUrl: `${appUrl}/frames/hello/opengraph-image`,
      buttonTitle: "Open",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}/api/webhook`,
      primaryCategory: "social",
    },
  };

  return Response.json(config);
}
