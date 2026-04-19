import { Route, Router, Routes } from 'react-router-dom'
// import SOSButton from './user_site/page/home/SOSButton.jsx'
// import AdminPanel from './admin_site/page/AdminPanel/AdminPanel.jsx'
// import Home from './user_site/page/home/Home'
// import Login from './user_site/page/login/Login'
// import SignUp from './user_site/page/signup/SignUp'
// import Login from "./admin_site/page/login/Login.jsx"
import UserRoutes from './user_site/UserRoutes.jsx'
import AdminRoutes from './admin_site/AdminRoutes.jsx'
// import SignUp from "./admin_site/page/signup/SignUp.jsx"
function App() {
  return (
    <>
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/*" element={<UserRoutes />} />
          {/* <Route path="/admin-login" element={<Login />} /> */}
        </Routes>
    </>
  )
}

export default App
