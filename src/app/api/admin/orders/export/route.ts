import { getAdmin } from "@/lib/session";
import { adminOrders } from "@/lib/tevents";
import { csvCell } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const rows = await adminOrders({ eventId: sp.get("event") ?? undefined, status: sp.get("status") ?? undefined, limit: 5000 });

  const head = ["Code", "Event", "Day", "Ticket", "Qty", "People", "Amount", "Status", "Name", "Phone", "Email", "UTR", "Booked at"];
  const body = rows.map((r) =>
    [
      r.code, r.eventTitle, r.day ?? "", r.tierName, r.quantity, r.admits, r.amount, r.status, r.name, r.phone, r.email,
      r.utr ?? "", new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    ].map(csvCell).join(",")
  );
  return new Response("\uFEFF" + [head.join(","), ...body].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="syncout-tickets.csv"`,
    },
  });
}
