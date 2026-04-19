import React from 'react'
import { Route, Routes } from 'react-router-dom'
import SignUp from "./page/signup/SignUp.jsx"
import Login from "./page/login/Login.jsx"
import SOSButton from "./page/home/SOSButton.jsx"
import Home from './page/home/Home.jsx'
import Profile from './page/profile/Profile.jsx'
import EditProfile from './page/EditProfile/EditProfile.jsx'
import SafeRouteFinder from './page/SafeRoutes/SafeRouteFinder.jsx'
import { RequireUserAuth } from '../components/RequireAuth.jsx'

const UserRoutes = () => {
  return (
    <Routes>
        <Route path='/' element={<Home/>}/>
        <Route
          path='/profile'
          element={
            <RequireUserAuth>
              <Profile/>
            </RequireUserAuth>
          }
        />
        <Route
          path='/edit-profile'
          element={
            <RequireUserAuth>
              <EditProfile/>
            </RequireUserAuth>
          }
        />
        <Route
          path='/safe-route'
          element={
            <RequireUserAuth>
              <SafeRouteFinder/>
            </RequireUserAuth>
          }
        />
        {/* <Route path='/home' element={<SOSButton/>}/> */}
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/login' element={<Login/>}/>
    </Routes>
  )
}

export default UserRoutes