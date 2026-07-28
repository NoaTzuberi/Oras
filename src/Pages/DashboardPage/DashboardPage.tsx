import { BottomNavBar } from "../../components/BottomNavBar/BottomNavBar";
import { TopNavBar } from "../../components/TopNavBar/TopNavBar";
import { MonthlyStats } from "../../components/MonthlyStats/MonthlyStats";

export const DashboardPage = () => {
  return (
  <div>
    <TopNavBar />
    <MonthlyStats />
    <BottomNavBar/>
  </div>
  )
};