import { BottomNavBar } from "../../components/BottomNavBar/BottomNavBar";
import { TopNavBar } from "../../components/TopNavBar/TopNavBar";
import { Dashboard } from "../../components/Dashboard/Dashboard";

export const DashboardPage = () => {
  return (
  <div>
    <TopNavBar />
    <Dashboard />
    <BottomNavBar/>
  </div>
  )
};