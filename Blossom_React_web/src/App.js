import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./pages/Profile";
import Profiles from "./pages/Profiles";
import SignUp from "./pages/SignUp";
import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/Login";
import MatchedList from "./pages/MatchedList";
import ProfileDetails from "./pages/ProfileDetails";
import ChatPage from "./pages/ChatPage";
import LikedYou from "./pages/LikedYou";
import ForgotPassword from "./pages/ForgotPassword";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="profile" element={<Profile />} />
        <Route path="profiles" element={<Profiles />} />
        <Route path="MatchedList" element={<MatchedList />} />
        <Route path="liked_you" element={<LikedYou />} />
        <Route path="sign_up" element={<SignUp />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route index element={<Homepage />} />
        <Route path="*" element={<PageNotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        <Route path="/profile/:id" element={<ProfileDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
