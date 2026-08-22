import type { Metadata } from "next";
import { DataTable, DashboardHeader, DashboardSidebar, StatCard } from "@/components/dashboard/components";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const projectRows = [
    ["Colombo Heights Residences", "Ceylon Urban Developments", "Colombo 03", "Rs. 48,000,000", "Now Selling", "Pending", "2026-08-18", "Approve | Reject | Edit | Preview | Publish | Unpublish | Delete"],
    ["Kandy Hills Residences", "Serendib Property Group", "Kandy", "Rs. 22,500,000", "Coming Soon", "Pending", "2026-08-19", "Approve | Reject | Edit | Preview | Publish | Unpublish | Delete"],
  ];
  const developerRows = [
    ["Ceylon Urban Developments", "Ceylon Urban Developments", "1", "Approved", "2016-03-12", "View"],
    ["Serendib Property Group", "Serendib Property Group", "1", "Approved", "2018-10-02", "View"],
  ];
  const leadRows = [
    ["Dinithi Perera", "dinithi.p@email.com", "+94 77 555 1122", "Colombo Heights Residences", "Ceylon Urban Developments", "2026-08-15", "New"],
    ["Nuwan Senanayake", "nuwan.s@email.com", "+94 71 421 4477", "Kandy Hills Residences", "Serendib Property Group", "2026-08-18", "Contacted"],
  ];
  const userRows = [
    ["Dinithi Perera", "dinithi.p@email.com", "Buyer", "Active", "2026-08-01"],
    ["Ceylon Urban Team", "sales@ceylonurban.lk", "Developer", "Active", "2026-07-15"],
    ["Platform Admin", "admin@lankaliving.lk", "Admin", "Active", "2026-06-10"],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <DashboardSidebar links={[{ label: "Overview", href: "/admin" }, { label: "Projects", href: "/admin" }, { label: "Developers", href: "/admin" }, { label: "Users", href: "/admin" }, { label: "Leads", href: "/admin" }, { label: "Articles", href: "/admin" }, { label: "Locations", href: "/admin" }, { label: "Settings", href: "/admin" }]} />
      <section className="space-y-4">
        <DashboardHeader title="Admin Dashboard" subtitle="Review, approve, and monitor marketplace operations." />
        <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
          <StatCard label="Total Projects" value="2" />
          <StatCard label="Published" value="1" />
          <StatCard label="Pending" value="1" />
          <StatCard label="Developers" value="2" />
          <StatCard label="Users" value="3" />
          <StatCard label="Leads" value="2" />
          <StatCard label="Views" value="20,570" />
        </div>
        <DataTable columns={["Project", "Developer", "Location", "Price", "Status", "Approval", "Submitted", "Actions"]} rows={projectRows} />
        <DataTable columns={["Developer", "Company", "Projects", "Status", "Joined", "Actions"]} rows={developerRows} />
        <DataTable columns={["Name", "Email", "Phone", "Project", "Developer", "Date", "Status"]} rows={leadRows} />
        <DataTable columns={["Name", "Email", "Role", "Status", "Joined"]} rows={userRows} />
      </section>
    </div>
  );
}
