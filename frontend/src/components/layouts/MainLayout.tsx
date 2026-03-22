import { Outlet } from "react-router";
import Header_Main from "../Header_Main";
import Footer_Main from "../Footer_Main";

const MainLayout = () => (
  <>
    <div className="flex flex-col bg-blue-100">
      <Header_Main />
      <Outlet />
      <Footer_Main />
    </div>
  </>
);

export default MainLayout;
