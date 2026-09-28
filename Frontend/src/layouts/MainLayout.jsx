import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

function MainLayout() {
  return (
    <div className="app-layout">

      <Sidebar />

      <div className="main-area">

        <Header />

        <main className="content">
          <Outlet />
        </main>

      </div>

    </div>
  )
}

export default MainLayout