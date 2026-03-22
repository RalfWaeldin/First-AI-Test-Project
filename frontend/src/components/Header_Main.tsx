import { Link } from "react-router";
import Logo from "./symbols/Logo";

export default function Header_Main() {
  return (
    <>
      <div className="sticky top-0 left-0 w-full  z-50">
        <div className="flex flex-col px-5 py-2 bg-blue-200">
          <nav className="flex gap-4">
            <Link to="/">
              <div className="flex">
                <Logo
                  colors={{
                    mitte: "#0000ff",
                    rechts: "#9999ff",
                    links: "#9999ff",
                    unten: "#6666ff",
                  }}
                  width="38"
                  height="38"
                />
                <div className="text-sm font-bold font-mono text-indigo-600 ml-2 mr-10">
                  Mini
                  <br />
                  AI
                </div>
              </div>
            </Link>
            <Link to="/">
              <div className="btn btn-ghost btn-sm btn-info text-xs">
                Simple Request
              </div>
            </Link>
            <Link to="/streaming">
              <div className="btn btn-ghost btn-sm btn-info text-xs">
                Streaming Request
              </div>
            </Link>
            <Link to="/openrouter">
              <div className="btn btn-ghost btn-sm btn-info text-xs">
                Streaming Open Router
              </div>
            </Link>
            <Link to="/interview">
              <div className="btn btn-ghost btn-sm btn-info text-xs">
                Interview
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
