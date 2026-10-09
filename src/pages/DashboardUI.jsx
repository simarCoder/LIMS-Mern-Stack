import DashboardCard from "../components/DashboardCards";
import {
  Users,
  FlaskConical,
  ClipboardList,
  FileText,
  Activity,
  TestTube,
} from "lucide-react";

function DashboardUI() {
  const cardContent = [
    { icon: Users, title: "Patients", value: 10 },
    { icon: FlaskConical, title: "Samples", value: 15 },
    { icon: ClipboardList, title: "Test Orders", value: 15 },
    { icon: FileText, title: "Reported", value: 15 },
    { icon: Activity, title: "Tests Completed", value: 15 },
    { icon: TestTube, title: "Pending Tests", value: 15 },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 m-1 sm:grid-cols-2 xl:grid-cols-6">
      {cardContent.map((item) => (
        <DashboardCard
          key={item.title}
          icon={item.icon}
          title={item.title}
          value={item.value}
        />
      ))}
    </div>
  );
}

export default DashboardUI;
