import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { OwnerIntakePage } from "./pages/OwnerIntakePage";
import { OwnerSummaryPage } from "./pages/OwnerSummaryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/owner/:visitToken" element={<OwnerIntakePage />} />
        <Route path="/owner/:visitToken/summary" element={<OwnerSummaryPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
