import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import AdminDashboard from "./pages/AdminDashboard";
import AdminPromos from "./pages/AdminPromos";
import AdminFriends from "./pages/AdminFriends";
import Claim from "./pages/Claim";
import Promotions from "./pages/Promotions";
import Venue from "./pages/Venue";
import Poster from "./pages/Poster";
import Partner from "./pages/Partner";
import VenueManage from "./pages/VenueManage";
import Business from "./pages/Business";
import { trackVisit } from "./api/analytics";

// Visits for the admin dashboard (see api/analytics.js).
function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackVisit(pathname);
  }, [pathname]);
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") trackVisit(window.location.pathname);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <VisitTracker />
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
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/promos" element={<AdminPromos />} />
        <Route path="/admin/friends" element={<AdminFriends />} />
        <Route path="/claim/:token" element={<Claim />} />
        <Route path="/promotions" element={<Promotions />} />
        {/* For the venues: check a couple's code, print the counter poster. */}
        <Route path="/venue" element={<Venue />} />
        <Route path="/poster/:offerId" element={<Poster />} />
        {/* "Partner with Blossom": the form, and each venue's private page. */}
        <Route path="/partner" element={<Partner />} />
        <Route path="/venue/manage/:token" element={<VenueManage />} />
        <Route path="/business" element={<Business />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
