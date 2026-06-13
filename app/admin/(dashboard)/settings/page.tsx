import PageHeader from "../../../_components/PageHeader";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Update branding, permissions, and integrations from a single place."
      />
      <div className="rounded-3xl border border-white/50 bg-white/75 p-6 shadow-sm backdrop-blur">
        <p className="text-sm text-muted-foreground">
          Settings configuration will live here.
        </p>
      </div>
    </div>
  );
}
