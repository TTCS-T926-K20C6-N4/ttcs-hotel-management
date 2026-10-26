import { Outlet, useOutletContext } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

function MainLayout() {
  const { user } = useOutletContext()

  return (
    <div className="app-layout">

      <Sidebar user={user} />

      <div className="main-area">

        <Header user={user} />

        <main className="content">
          <Outlet context={{ user }} />
        </main>

      </div>

    </div>
  )
}

export default MainLayout