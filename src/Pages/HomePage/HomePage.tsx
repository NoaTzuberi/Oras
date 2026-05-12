import { BottomNavBar } from '../../components/BottomNavBar/BottomNavBar'
import { Dashboard } from '../../components/Dashboard/Dashboard'
import { TopNavBar } from '../../components/TopNavBar/TopNavBar'
import './HomePage.css'

export const HomePage = () => {
  return (
    <div className="ui-layer">
      <TopNavBar />
      <Dashboard/>
      <BottomNavBar />
    </div>
  )
}