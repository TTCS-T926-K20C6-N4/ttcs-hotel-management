import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import RoomList from './pages/RoomList'
import AddRoom from './pages/AddRoom'

import './App.css'

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route element={<MainLayout />}>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/rooms"
            element={<RoomList />}
          />

          <Route
            path="/rooms/add"
            element={<AddRoom />}
          />

        </Route>

      </Routes>

    </BrowserRouter>
  )
}

export default App