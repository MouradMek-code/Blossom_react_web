import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Profile from "./pages/Profile";
import Profiles from "./pages/Profiles";
import SignUp from "./pages/SignUp";
import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/Login";
import ProfileDetails from "./pages/ProfileDetails";
import Settings from "./pages/Settings";
import ChatPage from "./pages/ChatPage";
import Messages from "./pages/Messages";
import LikedYou from "./pages/LikedYou";
import ForgotPassword from "./pages/ForgotPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import DateSpots from "./pages/DateSpots";
import DeleteAccount from "./pages/DeleteAccount";
import Admin from "./pages/Admin";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="profile" element={<Profile />} />
        <Route path="profiles" element={<Profiles />} />
        {/* Matches live at the top of the chats page now; old links still work. */}
        <Route path="MatchedList" element={<Navigate to="/messages" replace />} />
        <Route path="settings" element={<Settings />} />
        <Route path="liked_you" element={<LikedYou />} />
        <Route path="sign_up" element={<SignUp />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/messages" element={<Messages />} />
        <Route index element={<Homepage />} />
        <Route path="*" element={<PageNotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        <Route path="/profile/:id" element={<ProfileDetails />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/date-spots" element={<DateSpots />} />
        <Route path="/date-spots/:id" element={<DateSpots />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
