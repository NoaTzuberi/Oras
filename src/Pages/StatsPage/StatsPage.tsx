import { BottomNavBar } from "../../components/BottomNavBar/BottomNavBar";
import { TopNavBar } from "../../components/TopNavBar/TopNavBar";
import { MonthlyStats } from "../../components/MonthlyStats/MonthlyStats";

export const StatsPage = () => {
  return (
  <div>
    <TopNavBar />
    <MonthlyStats />
    <BottomNavBar/>
  </div>
  )
};