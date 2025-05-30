import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import NoPage from "./pages/NoPage";
import Projects from "./pages/projects";
import Project from "./pages/projects/Project";
import ProjectStats from "./pages/projects/Stats";
import AddProject from "./pages/projects/Add";
import Commits from "./pages/projects/Commits";
import Meetings from "./pages/meetings";
import ArrangeMeeting from "./pages/meetings/arrange";
import Tasks from "./pages/projects/tasks";
import AddTask from "./pages/projects/tasks/Add";
import Task from "./pages/projects/tasks/task";
import Students from "./pages/students";
import GoogleDrive from "pages/integrations/clouddrive/google";
import GoogleCalendar from "pages/integrations/planner/google";
import GitHub from "pages/integrations/gitrepo/github";
import Profile from "pages/profile";
import Integrations from "pages/profile/integrations";
import Settings from "pages/profile/settings";
import Login from "pages/auth/login";
import Logout from "pages/auth/logout";
import Register from "pages/auth/register";
import 'bootstrap/dist/css/bootstrap.min.css';
import AuthGuard from "pages/auth/authguard";
import "css/style.css"
import SetCalendar from "pages/integrations/planner/setCalendar";
import YandexDisk from "pages/integrations/clouddrive/yandex";
import Applications from "pages/applications";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/profile" >
            <Route index element={<AuthGuard Component={<Profile />} />} />
          </Route>
          <Route path="applications" >
          <Route index element={<AuthGuard Component={<Applications />} />} />
          </Route>
          <Route path="projects/" >
            <Route index element={<AuthGuard Component={<Projects />} />} />
            <Route path=":projectId/">
              <Route index element={<AuthGuard Component={<Project />} />} />
              <Route path="commits" element={<AuthGuard Component={<Commits />} />} />
              <Route path="stats" element={<AuthGuard Component={<ProjectStats />} />} />
              <Route path="tasks" >
                <Route index element={<AuthGuard Component={<Tasks />} />} />
                <Route path=":taskId/">
                  <Route index element={<AuthGuard Component={<Task />} />} />
                </Route>
                <Route path="add" element={<AuthGuard Component={<AddTask />} />} />
              </Route>
            </Route>
            <Route path="add" element={<Home />} />
          </Route>
          <Route path="meetings" >
            <Route index element={<AuthGuard Component={<Meetings />} />} />
            <Route path="arrange" element={<AuthGuard Component={<ArrangeMeeting />} />} />
          </Route>
          <Route path="scientificleadership/add" element={<AuthGuard Component={<AddProject />} />} />
          <Route path="integration/" >
            <Route path="setplanner" element={<SetCalendar />} />
            <Route path="googlecalendar" >
              <Route index element={<AuthGuard Component={<GoogleCalendar />} />} />
              <Route path="success" element={<Home />} />
            </Route>
            <Route path="googledrive" >
              <Route index element={<AuthGuard Component={<GoogleDrive />} />} />
              <Route path="success" element={<Home />} />
            </Route>
            <Route path="yandexdisk" >
              <Route index element={<AuthGuard Component={<YandexDisk />} />} />
              <Route path="success" element={<Home />} />
            </Route>
            <Route path="github" >
              <Route index element={<AuthGuard Component={<GitHub />} />} />
              <Route path="success" element={<Home />} />
            </Route>
          </Route>
          <Route path="scientificleadership/add" element={<AuthGuard Component={<AddProject />} />} />
          <Route path="students/" >
            <Route index element={<AuthGuard Component={<Students />} />} />
            <Route path="add" element={<Home />} />
          </Route>
          <Route path="*" element={<NoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);