import React from 'react'
import { Route, Routes } from 'react-router-dom'
import SignUp from './page/signup/SignUp.jsx'
import PoliceLogin from './page/login/Login.jsx'
import AdminPanel from './page/AdminPanel/AdminPanel.jsx'
import AdminLiveViewer from './page/AdminPanel/AdminLiveViewer.jsx'
import { RequireAdminAuth } from '../components/RequireAuth.jsx'

const AdminRoutes = () => {
  return (
    <Routes>
        <Route
          path='/live/:userId'
          element={
            <RequireAdminAuth>
              <AdminLiveViewer />
            </RequireAdminAuth>
          }
        />
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/login' element={<PoliceLogin/>}/>
        <Route
          path='/home'
          element={
            <RequireAdminAuth>
              <AdminPanel/>
            </RequireAdminAuth>
          }
        />
        <Route
          path='/'
          element={
            <RequireAdminAuth>
              <AdminPanel/>
            </RequireAdminAuth>
          }
        />
    </Routes>
  )
}

export default AdminRoutes