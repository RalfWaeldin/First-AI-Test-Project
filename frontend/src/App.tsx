import { BrowserRouter, Routes, Route } from "react-router";
import "./App.css";
import MainLayout from "./components/layouts/MainLayout";
import Home_Main from "./components/Home_Main";
import Streaming_Main from "./components/Streaming_Main";
import Streaming_OpenRouter from "./components/Streaming_OpenRouter";
import Interview_OpenRouter from "./components/Interview_OpenRouter";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Home_Main />} />
            <Route path="streaming" element={<Streaming_Main />} />
            <Route path="openrouter" element={<Streaming_OpenRouter />} />
            <Route path="interview" element={<Interview_OpenRouter />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
